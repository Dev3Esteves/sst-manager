/**
 * Processor pro job `documentos_lote`.
 *
 * Desacoplado do route handler antigo (`/api/documentos/lote`) — a ideia é
 * que a lógica de geração seja reusável tanto de forma síncrona (rota legacy,
 * mantida pra retro-compat) quanto via worker de fila (caminho novo).
 *
 * A chamada síncrona continua existindo, mas o caminho recomendado agora é
 * enfileirar e polling de `/jobs/:id`.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { renderToBuffer } from "@react-pdf/renderer"
import JSZip from "jszip"
import { z } from "zod"
import { renderAutorizacaoNrPdf } from "@/lib/pdf/autorizacao-nr"
import { renderCertificadoPdf } from "@/lib/pdf/certificado"
import { formatCNPJ, formatCPF } from "@/lib/validations/shared"
import { formatDate } from "@/lib/utils/vencimento"
import { buildDocFilename, MAX_LOTE, type LoteResultItem } from "@/lib/pdf/batch-utils"
import type { JobResult } from "../types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, "public", any>

const ESCOPO_PADRAO: Record<string, string> = {
  "NR-10": "Autorizado a executar atividades em instalações elétricas energizadas e desenergizadas em BT e MT, dentro da zona controlada, conforme procedimentos da empresa e item 10.8 da NR-10.",
  "NR-35": "Autorizado a executar trabalho em altura (acima de 2,00 m do nível inferior) utilizando sistemas de proteção contra quedas, conforme item 35.3 da NR-35.",
  "NR-33": "Autorizado a atuar como Trabalhador Autorizado em espaços confinados, realizando atividades conforme Permissão de Entrada e Trabalho (PET), item 33.3.5 da NR-33.",
}

/**
 * Schema do input do job. Exatamente o mesmo da route handler síncrona,
 * reusado aqui pra garantir que enqueue e execução validem a mesma coisa.
 */
export const documentosLoteInputSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("autorizacao_nr"),
    nr: z.enum(["NR-10", "NR-35", "NR-33"]),
    colaborador_ids: z.array(z.string().uuid()).min(1).max(MAX_LOTE),
    registrar: z.boolean().default(true),
    responsavel_nome: z.string().min(2).default("Engenheiro de Segurança do Trabalho"),
    responsavel_cargo: z.string().min(2).default("Engenheiro de Segurança do Trabalho"),
    empresa_id: z.string().uuid(),
  }),
  z.object({
    tipo: z.literal("certificado"),
    treinamento_id: z.string().uuid(),
    colaborador_ids: z.array(z.string().uuid()).min(1).max(MAX_LOTE),
  }),
])

export type DocumentosLoteInput = z.infer<typeof documentosLoteInputSchema>

/**
 * Executa o job. Recebe:
 *  - `supabase`: client com service_role (worker roda com auth elevada)
 *  - `input`: payload validado
 *  - `user_id`: pra stamping de `elaborado_por` (opcional)
 *  - `onProgress`: callback pra atualizar progresso incremental
 *
 * Retorna o JobResult com o caminho do ZIP no Storage.
 */
export async function processDocumentosLote(
  supabase: AnySupabase,
  input: DocumentosLoteInput,
  opts: {
    userId: string
    jobId: string
    onProgress?: (current: number, total: number) => Promise<void>
  },
): Promise<JobResult> {
  const zip = new JSZip()
  const resultados: LoteResultItem[] = []

  if (input.tipo === "autorizacao_nr") {
    await gerarAutorizacoesNr(supabase, input, zip, resultados, opts.userId, opts.onProgress)
  } else {
    await gerarCertificados(supabase, input, zip, resultados, opts.onProgress)
  }

  const gerados = resultados.filter((r) => r.status === "gerado").length
  const pulados = resultados.filter((r) => r.status === "pulado").length

  if (gerados === 0) {
    // Todos pulados — ainda salvamos o relatório pra debug
    const relatorio = buildRelatorio(resultados, input)
    zip.file("_relatorio.txt", relatorio)
    const emptyBuf = await zip.generateAsync({ type: "nodebuffer" })
    const emptyPath = await uploadResultZip(supabase, opts.jobId, emptyBuf, "Relatorio_vazio.zip")
    return {
      storage_path: emptyPath,
      filename: "Relatorio_vazio.zip",
      content_type: "application/zip",
      bytes: emptyBuf.length,
      summary: { gerados, pulados, resultados, todos_pulados: true },
    }
  }

  const relatorio = buildRelatorio(resultados, input)
  zip.file("_relatorio.txt", relatorio)

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
  const zipName =
    input.tipo === "autorizacao_nr"
      ? `Autorizacoes_${input.nr}_${new Date().toISOString().slice(0, 10)}.zip`
      : `Certificados_${new Date().toISOString().slice(0, 10)}.zip`

  const path = await uploadResultZip(supabase, opts.jobId, buffer, zipName)

  return {
    storage_path: path,
    filename: zipName,
    content_type: "application/zip",
    bytes: buffer.length,
    summary: { gerados, pulados, resultados },
  }
}

// ----------------------------------------------------------------------------
// Upload no bucket job-results
// ----------------------------------------------------------------------------
async function uploadResultZip(
  supabase: AnySupabase,
  jobId: string,
  buffer: Buffer,
  filename: string,
): Promise<string> {
  // Path convencional: `<jobId>/<filename>` — assim RLS futura pode filtrar
  // por prefix igual a jobs do user, e lista do bucket fica organizada.
  const path = `${jobId}/${filename}`
  const { error } = await supabase.storage.from("job-results").upload(path, buffer, {
    contentType: "application/zip",
    upsert: true,
  })
  if (error) throw new Error(`upload resultado: ${error.message}`)
  return path
}

// ----------------------------------------------------------------------------
// Geradores (copiados da route antiga, agora com onProgress)
// ----------------------------------------------------------------------------
async function gerarAutorizacoesNr(
  supabase: AnySupabase,
  input: Extract<DocumentosLoteInput, { tipo: "autorizacao_nr" }>,
  zip: JSZip,
  resultados: LoteResultItem[],
  userId: string,
  onProgress?: (current: number, total: number) => Promise<void>,
) {
  const { nr, colaborador_ids, registrar, empresa_id, responsavel_nome, responsavel_cargo } = input

  const { data: empresa } = await supabase
    .from("empresas")
    .select("razao_social, cnpj")
    .eq("id", empresa_id)
    .single()

  const { data: link } = await supabase
    .from("usuarios")
    .select("colaborador_id")
    .eq("id", userId)
    .single()

  const { data: colabs } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, cpf, matricula, cargos(titulo)")
    .in("id", colaborador_ids)

  const total = colaborador_ids.length
  for (let i = 0; i < colaborador_ids.length; i++) {
    const colabId = colaborador_ids[i]
    const colab = colabs?.find((c) => c.id === colabId)
    if (!colab) {
      resultados.push({
        colaborador_id: colabId,
        nome: "(não encontrado)",
        status: "pulado",
        motivo: "Colaborador não encontrado",
      })
      continue
    }

    const cargo = Array.isArray(colab.cargos) ? colab.cargos[0] : colab.cargos

    const [{ data: exames }, { data: treinos }] = await Promise.all([
      supabase
        .from("exames_medicos")
        .select("tipo, subtipo, data_realizacao, data_vencimento, resultado")
        .eq("colaborador_id", colabId)
        .eq("status", "vigente")
        .in("resultado", ["apto", "apto_restricao"])
        .order("data_vencimento", { ascending: false }),
      supabase
        .from("treinamentos_realizados")
        .select("data_realizacao, data_vencimento, treinamentos(titulo, nr_referencia, carga_horaria_horas)")
        .eq("colaborador_id", colabId)
        .eq("status", "vigente")
        .order("data_vencimento", { ascending: false }),
    ])

    const treinosDaNr = (treinos ?? []).filter((t) => {
      const tr = Array.isArray(t.treinamentos) ? t.treinamentos[0] : t.treinamentos
      return tr?.nr_referencia === nr
    })

    if (treinosDaNr.length === 0) {
      resultados.push({
        colaborador_id: colabId,
        nome: colab.nome_completo,
        status: "pulado",
        motivo: `Sem treinamento vigente de ${nr}`,
      })
      if (onProgress) await onProgress(i + 1, total)
      continue
    }
    if ((exames ?? []).length === 0) {
      resultados.push({
        colaborador_id: colabId,
        nome: colab.nome_completo,
        status: "pulado",
        motivo: "Sem ASO vigente com resultado apto",
      })
      if (onProgress) await onProgress(i + 1, total)
      continue
    }

    const dataEmissao = new Date().toISOString().slice(0, 10)
    const conteudo = {
      nr,
      colaborador: {
        nome: colab.nome_completo,
        cpf: colab.cpf,
        matricula: colab.matricula ?? null,
        cargo: cargo?.titulo ?? null,
      },
      treinamentos_validos: treinosDaNr.map((t) => {
        const tr = Array.isArray(t.treinamentos) ? t.treinamentos[0] : t.treinamentos
        return {
          titulo: tr?.titulo ?? "",
          carga: tr?.carga_horaria_horas ?? 0,
          data_realizacao: t.data_realizacao,
          data_vencimento: t.data_vencimento,
        }
      }),
      exames_validos: (exames ?? []).map((e) => ({
        tipo: e.tipo + (e.subtipo ? ` — ${e.subtipo}` : ""),
        data_realizacao: e.data_realizacao,
        data_vencimento: e.data_vencimento,
        resultado: e.resultado ?? "",
      })),
      escopo_autorizacao: ESCOPO_PADRAO[nr],
      responsavel_nome,
      responsavel_cargo,
    }

    let numeroSeq: number | null = null
    if (registrar) {
      const tipoKey = { "NR-10": "autorizacao_nr10", "NR-35": "autorizacao_nr35", "NR-33": "autorizacao_nr33" }[nr]
      const { data: doc, error: insertErr } = await supabase
        .from("documentos_sst")
        .insert({
          tipo: tipoKey,
          titulo: `Autorização ${nr} — ${colab.nome_completo}`,
          empresa_id,
          data_emissao: dataEmissao,
          status: "emitido",
          elaborado_por: link?.colaborador_id ?? null,
          conteudo,
        })
        .select("numero_sequencial")
        .single()
      if (insertErr) {
        resultados.push({
          colaborador_id: colabId,
          nome: colab.nome_completo,
          status: "pulado",
          motivo: `Erro ao registrar: ${insertErr.message}`,
        })
        if (onProgress) await onProgress(i + 1, total)
        continue
      }
      numeroSeq = doc.numero_sequencial
    }

    const meta = {
      numero: numeroSeq
        ? `${nr.toUpperCase()}-${new Date().getFullYear()}-${String(numeroSeq).padStart(4, "0")}`
        : `${nr.toUpperCase()}-LOTE-${new Date().toISOString().slice(0, 10)}`,
      titulo: `Autorização ${nr}`,
      empresaRazaoSocial: empresa?.razao_social ?? "—",
      empresaCnpj: empresa?.cnpj ? formatCNPJ(empresa.cnpj) : "—",
      localTrabalho: null,
      dataEmissao: formatDate(dataEmissao),
      dataValidade: null,
      validacaoUrl: undefined,
    }

    try {
      const element = await renderAutorizacaoNrPdf(meta, conteudo)
      const buffer = await renderToBuffer(element)
      const filename = buildDocFilename(nr, colab.nome_completo)
      zip.file(filename, buffer)
      resultados.push({
        colaborador_id: colabId,
        nome: colab.nome_completo,
        status: "gerado",
        filename,
      })
    } catch (err) {
      resultados.push({
        colaborador_id: colabId,
        nome: colab.nome_completo,
        status: "pulado",
        motivo: `Erro ao gerar PDF: ${(err as Error).message}`,
      })
    }
    if (onProgress) await onProgress(i + 1, total)
  }
}

async function gerarCertificados(
  supabase: AnySupabase,
  input: Extract<DocumentosLoteInput, { tipo: "certificado" }>,
  zip: JSZip,
  resultados: LoteResultItem[],
  onProgress?: (current: number, total: number) => Promise<void>,
) {
  const { treinamento_id, colaborador_ids } = input

  const { data: treinamento } = await supabase
    .from("treinamentos")
    .select(
      "id, titulo, nr_referencia, carga_horaria_horas, conteudo_programatico, texto_certificado, cidade_emissao",
    )
    .eq("id", treinamento_id)
    .single()

  if (!treinamento) {
    resultados.push({
      colaborador_id: "-",
      nome: "-",
      status: "pulado",
      motivo: "Treinamento não encontrado",
    })
    return
  }

  const { data: realizacoes } = await supabase
    .from("treinamentos_realizados")
    .select(
      "id, colaborador_id, data_realizacao, data_vencimento, instrutor, entidade, local, colaboradores(nome_completo, cpf, empresas(razao_social, cnpj, logo_url))",
    )
    .eq("treinamento_id", treinamento_id)
    .in("colaborador_id", colaborador_ids)
    .order("data_realizacao", { ascending: false })

  type Realizacao = NonNullable<typeof realizacoes>[number]
  const maisRecentePorColab = new Map<string, Realizacao>()
  for (const r of realizacoes ?? []) {
    if (!maisRecentePorColab.has(r.colaborador_id)) {
      maisRecentePorColab.set(r.colaborador_id, r)
    }
  }

  const total = colaborador_ids.length
  for (let i = 0; i < colaborador_ids.length; i++) {
    const colabId = colaborador_ids[i]
    const r = maisRecentePorColab.get(colabId)
    if (!r) {
      const { data: c } = await supabase
        .from("colaboradores")
        .select("nome_completo")
        .eq("id", colabId)
        .single()
      resultados.push({
        colaborador_id: colabId,
        nome: c?.nome_completo ?? "(desconhecido)",
        status: "pulado",
        motivo: "Não há realização deste treinamento para o colaborador",
      })
      if (onProgress) await onProgress(i + 1, total)
      continue
    }

    const colab = Array.isArray(r.colaboradores) ? r.colaboradores[0] : r.colaboradores
    const empresa = colab
      ? Array.isArray(colab.empresas) ? colab.empresas[0] : colab.empresas
      : null
    if (!colab || !empresa) {
      resultados.push({
        colaborador_id: colabId,
        nome: "(dados incompletos)",
        status: "pulado",
        motivo: "Colaborador/empresa não encontrados",
      })
      if (onProgress) await onProgress(i + 1, total)
      continue
    }

    const anoRea = new Date(r.data_realizacao).getFullYear()
    const numero = `CERT-${anoRea}-${r.id.slice(0, 8).toUpperCase()}`

    try {
      const element = await renderCertificadoPdf({
        numero,
        aluno_nome: colab.nome_completo,
        aluno_cpf: formatCPF(colab.cpf),
        curso_titulo: treinamento.titulo,
        nr_referencia: treinamento.nr_referencia,
        carga_horaria: treinamento.carga_horaria_horas,
        conteudo_programatico: treinamento.conteudo_programatico,
        data_realizacao: r.data_realizacao,
        data_vencimento: r.data_vencimento,
        cidade: treinamento.cidade_emissao || r.local || "São Paulo",
        instrutor_nome: r.instrutor,
        entidade: r.entidade,
        empresa_razao_social: empresa.razao_social,
        empresa_cnpj: formatCNPJ(empresa.cnpj),
        empresa_logo_url: empresa.logo_url ?? null,
        texto_certificado_template: treinamento.texto_certificado ?? null,
        validacao_url: undefined,
      })
      const buffer = await renderToBuffer(element)
      const prefix = treinamento.nr_referencia ? `CERT_${treinamento.nr_referencia}` : "CERT_TREINAMENTO"
      const filename = buildDocFilename(prefix, colab.nome_completo)
      zip.file(filename, buffer)
      resultados.push({
        colaborador_id: colabId,
        nome: colab.nome_completo,
        status: "gerado",
        filename,
      })
    } catch (err) {
      resultados.push({
        colaborador_id: colabId,
        nome: colab.nome_completo,
        status: "pulado",
        motivo: `Erro ao gerar PDF: ${(err as Error).message}`,
      })
    }
    if (onProgress) await onProgress(i + 1, total)
  }
}

function buildRelatorio(resultados: LoteResultItem[], input: DocumentosLoteInput): string {
  const gerados = resultados.filter((r) => r.status === "gerado")
  const pulados = resultados.filter((r) => r.status === "pulado")
  const tipoLabel = input.tipo === "autorizacao_nr" ? `Autorização ${input.nr}` : `Certificado de treinamento`

  return `RELATÓRIO DE GERAÇÃO EM LOTE
============================================================
Tipo:     ${tipoLabel}
Data:     ${new Date().toLocaleString("pt-BR")}
Total:    ${resultados.length}
Gerados:  ${gerados.length}
Pulados:  ${pulados.length}
============================================================

DOCUMENTOS GERADOS (${gerados.length})
${gerados.map((r) => `  ✓ ${r.filename}`).join("\n") || "  (nenhum)"}

DOCUMENTOS PULADOS (${pulados.length})
${pulados.map((r) => `  ✗ ${r.nome} — ${r.motivo}`).join("\n") || "  (nenhum)"}
`
}

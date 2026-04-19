import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { renderOsNr01Pdf, type EpiOsItem, type ColaboradorOs } from "@/lib/pdf/os-nr01"
import { formatCNPJ } from "@/lib/validations/shared"
import { episPorCargoSchema, type EpisPorCargo } from "@/lib/validations/cargo"

export async function POST(req: Request) {
  let body: {
    empresa_id?: string
    cargo_id?: string
    obra_id?: string
    numero?: string
    revisao?: string
    observacoes?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { empresa_id, cargo_id, obra_id } = body
  if (!empresa_id || !cargo_id || !obra_id) {
    return NextResponse.json({ error: "empresa_id, cargo_id e obra_id são obrigatórios" }, { status: 400 })
  }

  const supabase = await createClient()

  const [{ data: empresa }, { data: cargo }, { data: obra }] = await Promise.all([
    supabase
      .from("empresas")
      .select("razao_social, cnpj, logo_url")
      .eq("id", empresa_id)
      .single(),
    supabase
      .from("cargos")
      .select("titulo, descricao_atividades, riscos_associados, epis_obrigatorios")
      .eq("id", cargo_id)
      .single(),
    supabase
      .from("obras")
      .select("nome")
      .eq("id", obra_id)
      .single(),
  ])

  if (!empresa || !cargo || !obra) {
    return NextResponse.json({ error: "Empresa, cargo ou obra não encontrados" }, { status: 404 })
  }

  // Colaboradores da função alocados na obra (status ativo)
  const { data: colabs } = await supabase
    .from("colaboradores")
    .select("nome_completo, cpf, matricula, data_admissao")
    .eq("cargo_id", cargo_id)
    .eq("empresa_id", empresa_id)
    .eq("obra_id", obra_id)
    .eq("status", "ativo")
    .order("nome_completo")

  // Fallback: se nenhum na obra, pega todos da função na empresa
  let colaboradores: ColaboradorOs[] = colabs ?? []
  if (colaboradores.length === 0) {
    const { data: fallback } = await supabase
      .from("colaboradores")
      .select("nome_completo, cpf, matricula, data_admissao")
      .eq("cargo_id", cargo_id)
      .eq("empresa_id", empresa_id)
      .eq("status", "ativo")
      .order("nome_completo")
    colaboradores = fallback ?? []
  }

  if (colaboradores.length === 0) {
    return NextResponse.json(
      { error: "Nenhum colaborador ativo encontrado para esta função nesta empresa." },
      { status: 400 },
    )
  }

  // Riscos do cargo — riscos_associados pode ser string[] ou array de objetos
  const riscosRaw = cargo.riscos_associados as unknown
  const riscos: string[] = Array.isArray(riscosRaw)
    ? riscosRaw.map((r) => {
        if (typeof r === "string") return r
        if (r && typeof r === "object" && "descricao" in r) return String((r as { descricao: unknown }).descricao)
        return String(r)
      }).filter(Boolean)
    : []

  // EPIs — resolve os IDs para descrições/CAs reais
  const episParsed = episPorCargoSchema.safeParse(cargo.epis_obrigatorios ?? { obrigatorios: [], eventuais: [] })
  const epis: EpisPorCargo = episParsed.success
    ? episParsed.data
    : { obrigatorios: [], eventuais: [] }
  const epiIds = [
    ...epis.obrigatorios.map((e) => e.epi_id),
    ...epis.eventuais.map((e) => e.epi_id),
  ]
  let episById: Record<string, { descricao: string; ca: string | null }> = {}
  if (epiIds.length > 0) {
    const { data: epiRows } = await supabase
      .from("epis")
      .select("id, descricao, ca")
      .in("id", epiIds)
    episById = Object.fromEntries(
      (epiRows ?? []).map((e) => [e.id, { descricao: e.descricao, ca: e.ca ?? null }]),
    )
  }
  const mapEpis = (lista: EpisPorCargo["obrigatorios"]): EpiOsItem[] => {
    const out: EpiOsItem[] = []
    for (const item of lista) {
      const dados = episById[item.epi_id]
      if (!dados) continue
      out.push({
        descricao: dados.descricao,
        ca: dados.ca,
        observacao: item.observacao ?? null,
      })
    }
    return out
  }

  const medidasPreventivas: string[] = [
    "Utilizar permanentemente os EPIs obrigatórios listados abaixo.",
    "Seguir os procedimentos operacionais e permissões de trabalho aplicáveis.",
    "Isolar e sinalizar a área de trabalho antes de iniciar a atividade.",
    "Paralisar a atividade em caso de condição insegura e comunicar o responsável.",
  ]

  const numero = body.numero && body.numero.trim().length > 0
    ? body.numero.trim()
    : `OS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  const pdfElement = await renderOsNr01Pdf({
    empresa_razao_social: empresa.razao_social,
    empresa_cnpj: formatCNPJ(empresa.cnpj),
    empresa_logo_url: empresa.logo_url ?? null,
    numero_os: numero,
    data_emissao: new Date().toISOString().slice(0, 10),
    revisao: body.revisao || "00",
    obra_nome: obra.nome,
    cargo_titulo: cargo.titulo,
    descricao_atividades: cargo.descricao_atividades,
    riscos,
    medidas_preventivas: medidasPreventivas,
    epis_obrigatorios: mapEpis(epis.obrigatorios),
    epis_eventuais: mapEpis(epis.eventuais),
    observacoes: body.observacoes ?? null,
    colaboradores,
  })

  // Persistir como documento_sst (um registro consolidado)
  await supabase.from("documentos_sst").insert({
    tipo: "os_nr01",
    titulo: `OS NR-01 — ${cargo.titulo}`,
    empresa_id,
    obra_id,
    local_trabalho: obra.nome,
    data_emissao: new Date().toISOString().slice(0, 10),
    status: "emitido",
    conteudo: {
      cargo_id,
      cargo_titulo: cargo.titulo,
      obra_nome: obra.nome,
      colaboradores_count: colaboradores.length,
      numero_os: numero,
      revisao: body.revisao || "00",
    },
  })

  const buffer = await renderToBuffer(pdfElement)
  const filename = `OS-NR01-${cargo.titulo.replace(/\s+/g, "_")}-${obra.nome.replace(/\s+/g, "_")}.pdf`
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

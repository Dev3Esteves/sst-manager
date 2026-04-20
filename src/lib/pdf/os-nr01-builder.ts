import type { SupabaseClient } from "@supabase/supabase-js"
import { episPorCargoSchema, type EpisPorCargo } from "@/lib/validations/cargo"
import { formatCNPJ } from "@/lib/validations/shared"
import type { EpiOsItem, ColaboradorOs, OsNr01Data } from "./os-nr01"

/**
 * Input do builder. IDs das entidades + metadados do documento emitido.
 * Permite re-renderizar o PDF tanto na emissão inicial (`/gerar`) quanto
 * em qualquer download posterior (`/api/documentos/[id]/pdf`), mantendo
 * uma única fonte de verdade para montagem do PDF.
 */
export type BuildOsNr01Input = {
  empresa_id: string
  cargo_id: string
  obra_id: string
  numero_os: string
  data_emissao: string // ISO (yyyy-mm-dd)
  revisao?: string
  observacoes?: string | null
}

export type BuildOsNr01Result =
  | { ok: true; data: OsNr01Data; colaboradoresCount: number }
  | { ok: false; error: string; status: number }

const MEDIDAS_PREVENTIVAS_PADRAO: string[] = [
  "Utilizar permanentemente os EPIs obrigatórios listados abaixo.",
  "Seguir os procedimentos operacionais e permissões de trabalho aplicáveis.",
  "Isolar e sinalizar a área de trabalho antes de iniciar a atividade.",
  "Paralisar a atividade em caso de condição insegura e comunicar o responsável.",
]

/**
 * Monta o payload `OsNr01Data` resolvendo todas as entidades a partir dos
 * IDs: empresa + logo, cargo + riscos + EPIs (resolvidos pra descrição/CA),
 * obra e colaboradores da função alocados naquela obra.
 *
 * Fallback: se nenhum colaborador ativo estiver alocado na obra específica,
 * usa todos os colaboradores ativos da função na empresa (útil logo após
 * cadastro quando a alocação pode ainda não ter sido feita).
 */
export async function buildOsNr01Data(
  // Schema não está tipado (projeto não usa Database<> ainda) — usa o genérico
  // do próprio Supabase, que aceita qualquer cliente criado por createClient.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, "public", any>,
  input: BuildOsNr01Input,
): Promise<BuildOsNr01Result> {
  const [{ data: empresa }, { data: cargo }, { data: obra }] = await Promise.all([
    supabase
      .from("empresas")
      .select("razao_social, cnpj, logo_url")
      .eq("id", input.empresa_id)
      .single(),
    supabase
      .from("cargos")
      .select("titulo, descricao_atividades, riscos_associados, epis_obrigatorios")
      .eq("id", input.cargo_id)
      .single(),
    supabase
      .from("obras")
      .select("nome")
      .eq("id", input.obra_id)
      .single(),
  ])

  if (!empresa || !cargo || !obra) {
    return { ok: false, error: "Empresa, cargo ou obra não encontrados", status: 404 }
  }

  // Colaboradores da função alocados na obra (ativos)
  const { data: colabs } = await supabase
    .from("colaboradores")
    .select("nome_completo, cpf, matricula, data_admissao")
    .eq("cargo_id", input.cargo_id)
    .eq("empresa_id", input.empresa_id)
    .eq("obra_id", input.obra_id)
    .eq("status", "ativo")
    .order("nome_completo")

  let colaboradores: ColaboradorOs[] = colabs ?? []
  if (colaboradores.length === 0) {
    const { data: fallback } = await supabase
      .from("colaboradores")
      .select("nome_completo, cpf, matricula, data_admissao")
      .eq("cargo_id", input.cargo_id)
      .eq("empresa_id", input.empresa_id)
      .eq("status", "ativo")
      .order("nome_completo")
    colaboradores = fallback ?? []
  }

  if (colaboradores.length === 0) {
    return {
      ok: false,
      error: "Nenhum colaborador ativo encontrado para esta função nesta empresa.",
      status: 400,
    }
  }

  // Riscos — normaliza string[] ou array de objetos { descricao }
  const riscosRaw = cargo.riscos_associados as unknown
  const riscos: string[] = Array.isArray(riscosRaw)
    ? riscosRaw.map((r) => {
        if (typeof r === "string") return r
        if (r && typeof r === "object" && "descricao" in r) return String((r as { descricao: unknown }).descricao)
        return String(r)
      }).filter(Boolean)
    : []

  // EPIs por cargo — resolve IDs para descrições/CAs reais
  const episParsed = episPorCargoSchema.safeParse(
    cargo.epis_obrigatorios ?? { obrigatorios: [], eventuais: [] },
  )
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

  const data: OsNr01Data = {
    empresa_razao_social: empresa.razao_social,
    empresa_cnpj: formatCNPJ(empresa.cnpj),
    empresa_logo_url: empresa.logo_url ?? null,
    numero_os: input.numero_os,
    data_emissao: input.data_emissao,
    revisao: input.revisao || "00",
    obra_nome: obra.nome,
    cargo_titulo: cargo.titulo,
    descricao_atividades: cargo.descricao_atividades,
    riscos,
    medidas_preventivas: MEDIDAS_PREVENTIVAS_PADRAO,
    epis_obrigatorios: mapEpis(epis.obrigatorios),
    epis_eventuais: mapEpis(epis.eventuais),
    observacoes: input.observacoes ?? null,
    colaboradores,
  }

  return { ok: true, data, colaboradoresCount: colaboradores.length }
}

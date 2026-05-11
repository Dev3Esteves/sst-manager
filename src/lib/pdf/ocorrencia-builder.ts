import type { SupabaseClient } from "@supabase/supabase-js"
import type { InvestigacaoInput, AcaoCorretiva } from "@/lib/validations/ocorrencia"

export type OcorrenciaPdfData = {
  numero_sequencial: number
  tipo: string
  tipo_label: string
  data_ocorrencia: string
  local: string
  descricao: string
  gravidade: string | null
  gravidade_label: string | null
  parte_corpo_atingida: string | null
  natureza_lesao: string | null
  agente_causador: string | null
  dias_afastamento: number | null
  status: string
  empresa_razao_social: string
  empresa_cnpj: string
  colaborador_nome: string | null
  investigacao: InvestigacaoInput | null
  acoes_corretivas: AcaoCorretiva[]
}

export type BuildResult =
  | { ok: true; data: OcorrenciaPdfData }
  | { ok: false; status: number; error: string }

const TIPOS: Record<string, string> = {
  acidente_tipico: "Acidente típico",
  acidente_trajeto: "Acidente de trajeto",
  doenca_ocupacional: "Doença ocupacional",
  quase_acidente: "Quase acidente",
  incidente: "Incidente",
  condicao_insegura: "Condição insegura",
  ato_inseguro: "Ato inseguro",
  desvio: "Desvio",
  emergencia: "Emergência",
}

const GRAVIDADE: Record<string, string> = {
  leve: "Leve",
  moderado: "Moderado",
  grave: "Grave",
  fatal: "Fatal",
}

export async function buildOcorrenciaPdfData(
  supabase: SupabaseClient,
  ocorrenciaId: string,
): Promise<BuildResult> {
  const { data: oc, error } = await supabase
    .from("ocorrencias")
    .select("*, colaboradores(nome_completo), empresas(razao_social, cnpj)")
    .eq("id", ocorrenciaId)
    .single()

  if (error || !oc) {
    return { ok: false, status: 404, error: "Ocorrência não encontrada" }
  }

  const col = Array.isArray(oc.colaboradores) ? oc.colaboradores[0] : oc.colaboradores
  const emp = Array.isArray(oc.empresas) ? oc.empresas[0] : oc.empresas

  if (!emp) {
    return { ok: false, status: 500, error: "Empresa da ocorrência não encontrada" }
  }

  return {
    ok: true,
    data: {
      numero_sequencial: oc.numero_sequencial,
      tipo: oc.tipo,
      tipo_label: TIPOS[oc.tipo] ?? oc.tipo,
      data_ocorrencia: oc.data_ocorrencia,
      local: oc.local,
      descricao: oc.descricao,
      gravidade: oc.gravidade,
      gravidade_label: oc.gravidade ? GRAVIDADE[oc.gravidade] ?? oc.gravidade : null,
      parte_corpo_atingida: oc.parte_corpo_atingida,
      natureza_lesao: oc.natureza_lesao,
      agente_causador: oc.agente_causador,
      dias_afastamento: oc.dias_afastamento,
      status: oc.status,
      empresa_razao_social: emp.razao_social,
      empresa_cnpj: emp.cnpj,
      colaborador_nome: col?.nome_completo ?? null,
      investigacao: (oc.investigacao as InvestigacaoInput) ?? null,
      acoes_corretivas: (oc.acoes_corretivas as AcaoCorretiva[]) ?? [],
    },
  }
}

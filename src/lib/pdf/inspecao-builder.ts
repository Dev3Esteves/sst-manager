import type { SupabaseClient } from "@supabase/supabase-js"
import type { RespostaItem } from "@/lib/validations/inspecao"

export type InspecaoPdfData = {
  template_titulo: string
  template_categoria: string | null
  empresa_razao_social: string
  empresa_cnpj: string
  inspetor_nome: string | null
  local: string
  data_inspecao: string
  status: string
  percentual_conformidade: number | null
  respostas: RespostaItem[]
  observacoes_gerais: string | null
}

export type BuildResult =
  | { ok: true; data: InspecaoPdfData }
  | { ok: false; status: number; error: string }

export async function buildInspecaoPdfData(
  supabase: SupabaseClient,
  inspecaoId: string,
): Promise<BuildResult> {
  const { data: inspecao, error } = await supabase
    .from("inspecoes")
    .select(`
      id, local, data_inspecao, status, percentual_conformidade,
      respostas, observacoes_gerais,
      templates_inspecao(titulo, categoria),
      colaboradores(nome_completo),
      empresas(razao_social, cnpj)
    `)
    .eq("id", inspecaoId)
    .single()

  if (error || !inspecao) {
    return { ok: false, status: 404, error: "Inspeção não encontrada" }
  }

  const tpl = Array.isArray(inspecao.templates_inspecao)
    ? inspecao.templates_inspecao[0]
    : inspecao.templates_inspecao
  const insp = Array.isArray(inspecao.colaboradores)
    ? inspecao.colaboradores[0]
    : inspecao.colaboradores
  const emp = Array.isArray(inspecao.empresas)
    ? inspecao.empresas[0]
    : inspecao.empresas

  if (!emp) {
    return { ok: false, status: 500, error: "Empresa da inspeção não encontrada" }
  }

  return {
    ok: true,
    data: {
      template_titulo: tpl?.titulo ?? "Inspeção",
      template_categoria: tpl?.categoria ?? null,
      empresa_razao_social: emp.razao_social,
      empresa_cnpj: emp.cnpj,
      inspetor_nome: insp?.nome_completo ?? null,
      local: inspecao.local,
      data_inspecao: inspecao.data_inspecao,
      status: inspecao.status,
      percentual_conformidade: inspecao.percentual_conformidade,
      respostas: (inspecao.respostas as RespostaItem[]) ?? [],
      observacoes_gerais: inspecao.observacoes_gerais,
    },
  }
}

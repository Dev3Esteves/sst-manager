import { z } from "zod"

export const acaoCorretivaSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  responsavel: z.string().min(1, "Responsável obrigatório"),
  prazo: z.string().min(1, "Prazo obrigatório"),
  status: z.enum(["pendente", "em_andamento", "concluida"]).default("pendente"),
})

export const ocorrenciaSchema = z.object({
  empresa_id: z.string().uuid(),
  tipo: z.enum([
    "acidente_tipico", "acidente_trajeto", "doenca_ocupacional",
    "quase_acidente", "incidente", "condicao_insegura", "ato_inseguro",
    "desvio", "emergencia",
  ]),
  data_ocorrencia: z.string().min(1, "Data obrigatória"),
  local: z.string().min(1, "Local obrigatório"),
  descricao: z.string().min(10, "Descreva com pelo menos 10 caracteres"),
  colaborador_id: z.string().uuid().optional().nullable(),
  gravidade: z.enum(["leve", "moderado", "grave", "fatal"]).optional().nullable(),
  parte_corpo_atingida: z.string().optional().nullable(),
  natureza_lesao: z.string().optional().nullable(),
  agente_causador: z.string().optional().nullable(),
  dias_afastamento: z.coerce.number().int().min(0).optional().nullable(),
  obra_local_id: z.string().uuid().optional().nullable(),
})

export type OcorrenciaInput = z.infer<typeof ocorrenciaSchema>
export type AcaoCorretiva = z.infer<typeof acaoCorretivaSchema>

export const investigacaoSchema = z.object({
  metodo: z.literal("cinco_porques"),
  problema: z.string().min(5),
  porques: z.array(z.string().min(1)).length(5, "Complete os 5 porquês"),
  causa_raiz: z.string().min(5),
  acoes_corretivas: z.array(acaoCorretivaSchema).min(1, "Adicione ao menos 1 ação"),
})

export type InvestigacaoInput = z.infer<typeof investigacaoSchema>

export const OCORRENCIA_TIPOS: Record<string, string> = {
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

export const GRAVIDADE_LABEL: Record<string, string> = {
  leve: "Leve", moderado: "Moderado", grave: "Grave", fatal: "Fatal",
}

// --------------------------------------------------------------------------
// TEMPLATES de ocorrência (catálogo global — pré-configura o formulário)
// --------------------------------------------------------------------------

export const templateOcorrenciaSchema = z.object({
  tipo: z.enum([
    "acidente_tipico", "acidente_trajeto", "doenca_ocupacional",
    "quase_acidente", "incidente", "condicao_insegura", "ato_inseguro",
    "desvio", "emergencia",
  ]),
  titulo: z.string().min(3, "Título obrigatório (mín. 3 caracteres)"),
  descricao_modelo: z.string().optional().nullable(),
  gravidade_sugerida: z.enum(["leve", "moderado", "grave", "fatal"]).optional().nullable(),
  natureza_lesao_sugerida: z.string().optional().nullable(),
  agente_causador_sugerido: z.string().optional().nullable(),
  roteiro_investigacao: z.array(z.string().min(1)).optional().nullable(),
  ativo: z.boolean().default(true),
})

export type TemplateOcorrenciaInput = z.infer<typeof templateOcorrenciaSchema>

/** Defaults que um template injeta no formulário de nova ocorrência. */
export type TemplateOcorrenciaInit = {
  tipo: OcorrenciaInput["tipo"]
  descricao_modelo: string | null
  gravidade_sugerida: OcorrenciaInput["gravidade"]
  natureza_lesao_sugerida: string | null
  agente_causador_sugerido: string | null
  roteiro_investigacao: string[] | null
}

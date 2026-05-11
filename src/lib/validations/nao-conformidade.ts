import { z } from "zod"

// -----------------------------------------------------------------------------
// Não-Conformidade (NC) — ISO 45001 cl. 10.2
// -----------------------------------------------------------------------------

export const NC_ORIGEM = [
  "ocorrencia",
  "auditoria_interna",
  "auditoria_externa",
  "inspecao",
  "reclamacao",
  "desvio",
  "outro",
] as const
export type NcOrigem = (typeof NC_ORIGEM)[number]

export const NC_ORIGEM_LABEL: Record<NcOrigem, string> = {
  ocorrencia: "Ocorrência",
  auditoria_interna: "Auditoria interna",
  auditoria_externa: "Auditoria externa",
  inspecao: "Inspeção",
  reclamacao: "Reclamação",
  desvio: "Desvio",
  outro: "Outro",
}

export const NC_SEVERIDADE = ["baixa", "media", "alta", "critica"] as const
export type NcSeveridade = (typeof NC_SEVERIDADE)[number]

export const NC_SEVERIDADE_LABEL: Record<NcSeveridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
}

export const NC_STATUS = [
  "aberta",
  "em_analise",
  "em_tratamento",
  "verificacao",
  "encerrada",
  "cancelada",
] as const
export type NcStatus = (typeof NC_STATUS)[number]

export const NC_STATUS_LABEL: Record<NcStatus, string> = {
  aberta: "Aberta",
  em_analise: "Em análise",
  em_tratamento: "Em tratamento",
  verificacao: "Aguardando verificação",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
}

export const NC_METODO_ANALISE = ["5whys", "ishikawa", "ambos", "outro"] as const
export type NcMetodoAnalise = (typeof NC_METODO_ANALISE)[number]

export const NC_METODO_ANALISE_LABEL: Record<NcMetodoAnalise, string> = {
  "5whys": "5 Porquês",
  ishikawa: "Ishikawa (6M)",
  ambos: "5 Porquês + Ishikawa",
  outro: "Outro método",
}

export const naoConformidadeSchema = z.object({
  empresa_id: z.string().uuid("Empresa obrigatória"),
  obra_id: z.string().uuid().optional().nullable(),
  ocorrencia_id: z.string().uuid().optional().nullable(),
  titulo: z.string().min(3, "Título obrigatório (mín. 3 caracteres)"),
  descricao: z.string().min(10, "Descreva a NC com pelo menos 10 caracteres"),
  origem: z.enum(NC_ORIGEM),
  data_identificacao: z.string().min(10, "Data obrigatória (YYYY-MM-DD)"),
  identificado_por_nome: z.string().optional().nullable(),
  identificado_por_id: z.string().uuid().optional().nullable(),
  severidade: z.enum(NC_SEVERIDADE).default("media"),
  status: z.enum(NC_STATUS).default("aberta"),
  data_encerramento: z.string().optional().nullable(),
  metodo_analise: z.enum(NC_METODO_ANALISE).optional().nullable(),
  causa_raiz_consolidada: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export type NaoConformidadeInput = z.infer<typeof naoConformidadeSchema>

// -----------------------------------------------------------------------------
// 5 Whys (porquês)
// -----------------------------------------------------------------------------

export const ncCausa5whysSchema = z.object({
  nao_conformidade_id: z.string().uuid(),
  ordem: z.coerce.number().int().min(1).max(5),
  pergunta: z.string().min(3, "Pergunta obrigatória"),
  resposta: z.string().min(3, "Resposta obrigatória"),
  eh_causa_raiz: z.boolean().default(false),
})

export type NcCausa5whysInput = z.infer<typeof ncCausa5whysSchema>

// -----------------------------------------------------------------------------
// Ishikawa (6M)
// -----------------------------------------------------------------------------

export const ISHIKAWA_CATEGORIA = [
  "metodo",
  "maquina",
  "material",
  "mao_de_obra",
  "medida",
  "meio_ambiente",
] as const
export type IshikawaCategoria = (typeof ISHIKAWA_CATEGORIA)[number]

export const ISHIKAWA_CATEGORIA_LABEL: Record<IshikawaCategoria, string> = {
  metodo: "Método",
  maquina: "Máquina",
  material: "Material",
  mao_de_obra: "Mão-de-obra",
  medida: "Medida",
  meio_ambiente: "Meio-ambiente",
}

/** Texto auxiliar mostrado no editor para guiar o preenchimento. */
export const ISHIKAWA_CATEGORIA_HINT: Record<IshikawaCategoria, string> = {
  metodo: "Procedimento, ordem de serviço, treinamento, fluxo de trabalho",
  maquina: "Equipamento, ferramenta, sistema, infra",
  material: "Insumo, EPI, peça, matéria-prima",
  mao_de_obra: "Pessoa, competência, comportamento, fadiga",
  medida: "Métrica, indicador, controle, calibração",
  meio_ambiente: "Local físico, clima, ergonomia, ruído ambiental",
}

export const ncCausaIshikawaSchema = z.object({
  nao_conformidade_id: z.string().uuid(),
  categoria: z.enum(ISHIKAWA_CATEGORIA),
  causa: z.string().min(3, "Causa obrigatória"),
  eh_causa_raiz: z.boolean().default(false),
  ordem: z.coerce.number().int().nonnegative().default(0),
})

export type NcCausaIshikawaInput = z.infer<typeof ncCausaIshikawaSchema>

// -----------------------------------------------------------------------------
// Ação Corretiva (AC) — PDCA + verificação de eficácia
// -----------------------------------------------------------------------------

export const AC_TIPO = ["contencao", "corretiva", "preventiva"] as const
export type AcTipo = (typeof AC_TIPO)[number]

export const AC_TIPO_LABEL: Record<AcTipo, string> = {
  contencao: "Contenção (imediata)",
  corretiva: "Corretiva (elimina causa raiz)",
  preventiva: "Preventiva (antes do fato)",
}

export const AC_STATUS = ["planejada", "em_andamento", "concluida", "cancelada"] as const
export type AcStatus = (typeof AC_STATUS)[number]

export const AC_STATUS_LABEL: Record<AcStatus, string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
}

export const ncAcaoCorretivaSchema = z.object({
  nao_conformidade_id: z.string().uuid(),
  numero_sequencial: z.coerce.number().int().positive(),
  tipo: z.enum(AC_TIPO).default("corretiva"),
  descricao: z.string().min(3, "Descrição obrigatória"),
  responsavel_nome: z.string().optional().nullable(),
  responsavel_id: z.string().uuid().optional().nullable(),
  data_prazo: z.string().min(10, "Prazo obrigatório (YYYY-MM-DD)"),
  data_inicio: z.string().optional().nullable(),
  data_conclusao: z.string().optional().nullable(),
  status: z.enum(AC_STATUS).default("planejada"),
  evidencia_eficacia: z.string().optional().nullable(),
  verificado_em: z.string().optional().nullable(),
  verificado_por_nome: z.string().optional().nullable(),
  eficaz: z.boolean().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export type NcAcaoCorretivaInput = z.infer<typeof ncAcaoCorretivaSchema>

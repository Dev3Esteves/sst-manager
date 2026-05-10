import { z } from "zod"

/**
 * Status do PGR (NR-1). Padrão de ciclo de vida:
 *   rascunho → vigente → superseded (quando nova revisão entra) ou → vencido.
 */
export const PGR_STATUS = ["rascunho", "vigente", "superseded", "vencido"] as const
export type PgrStatus = (typeof PGR_STATUS)[number]

export const PGR_STATUS_LABEL: Record<PgrStatus, string> = {
  rascunho: "Rascunho",
  vigente: "Vigente",
  superseded: "Substituído",
  vencido: "Vencido",
}

export const pgrSchema = z.object({
  obra_id: z.string().uuid("Obra obrigatória"),
  numero_revisao: z.coerce.number().int().min(0, "Revisão deve ser ≥ 0").default(0),
  descricao_revisao: z.string().optional().nullable(),
  data_emissao: z.string().min(10, "Data de emissão obrigatória (YYYY-MM-DD)"),
  data_vencimento: z.string().min(10, "Data de vencimento obrigatória (YYYY-MM-DD)"),
  status: z.enum(PGR_STATUS).default("rascunho"),

  responsavel_elaboracao_nome: z.string().optional().nullable(),
  responsavel_elaboracao_funcao: z.string().optional().nullable(),
  responsavel_elaboracao_crea: z.string().optional().nullable(),
  responsavel_obra_nome: z.string().optional().nullable(),
  responsavel_obra_funcao: z.string().optional().nullable(),
  responsavel_obra_crea: z.string().optional().nullable(),

  cno_obra_snapshot: z.string().optional().nullable(),
  num_empregados_snapshot: z.coerce.number().int().positive().optional().nullable(),
  data_inicio_obra_snapshot: z.string().optional().nullable(),

  codigo_formulario: z.string().default("FO-121-00"),
})

export type PgrInput = z.infer<typeof pgrSchema>

// -----------------------------------------------------------------------------
// GHE — Grupo Homogêneo de Exposição
// -----------------------------------------------------------------------------

export const gheSchema = z.object({
  pgr_id: z.string().uuid(),
  codigo: z.string().min(1, "Código obrigatório (ex.: GHE 01)"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  funcao_posicao: z.string().optional().nullable(),
  area_identificacao: z.string().optional().nullable(),
  caracterizacao_atividades: z.string().optional().nullable(),
  local_trabalho: z.string().optional().nullable(),
  num_empregados_expostos: z.coerce.number().int().nonnegative().optional().nullable(),
  ordem: z.coerce.number().int().nonnegative().default(0),
})

export type GheInput = z.infer<typeof gheSchema>

// -----------------------------------------------------------------------------
// Risco — Inventário (Anexo III)
// -----------------------------------------------------------------------------

export const RISCO_CATEGORIA = [
  "fisico",
  "quimico",
  "biologico",
  "ergonomico",
  "acidente",
  "psicossocial",
] as const
export type RiscoCategoria = (typeof RISCO_CATEGORIA)[number]

export const RISCO_CATEGORIA_LABEL: Record<RiscoCategoria, string> = {
  fisico: "Físico",
  quimico: "Químico",
  biologico: "Biológico",
  ergonomico: "Ergonômico",
  acidente: "Acidente",
  psicossocial: "Psicossocial",
}

export const TIPO_EXPOSICAO = ["eventual", "moderado", "habitual"] as const
export type TipoExposicao = (typeof TIPO_EXPOSICAO)[number]

export const TIPO_EXPOSICAO_LABEL: Record<TipoExposicao, string> = {
  eventual: "Eventual",
  moderado: "Moderado",
  habitual: "Habitual",
}

export const CATEGORIA_RISCO = ["muito_baixo", "baixo", "medio", "alto", "muito_alto"] as const
export type CategoriaRisco = (typeof CATEGORIA_RISCO)[number]

export const CATEGORIA_RISCO_LABEL: Record<CategoriaRisco, string> = {
  muito_baixo: "Muito Baixo",
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
  muito_alto: "Muito Alto",
}

export const riscoSchema = z.object({
  pgr_ghe_id: z.string().uuid(),
  categoria: z.enum(RISCO_CATEGORIA),
  agente_ambiental: z.string().min(1, "Agente obrigatório"),
  codigo_esocial: z.string().optional().nullable(),
  fontes_geradoras: z.string().optional().nullable(),
  trajetoria: z.string().optional().nullable(),
  via_ingresso: z.string().optional().nullable(),
  possiveis_danos: z.string().optional().nullable(),
  tipo_exposicao: z.enum(TIPO_EXPOSICAO).optional().nullable(),
  categoria_risco: z.enum(CATEGORIA_RISCO).optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ordem: z.coerce.number().int().nonnegative().default(0),
})

export type RiscoInput = z.infer<typeof riscoSchema>

// -----------------------------------------------------------------------------
// Ação 5W1H — Cronograma (Anexo I)
// -----------------------------------------------------------------------------

export const ACAO_STATUS = [
  "planejado",
  "em_andamento",
  "concluido",
  "pendente",
  "continuo",
  "cancelado",
] as const
export type AcaoStatus = (typeof ACAO_STATUS)[number]

export const ACAO_STATUS_LABEL: Record<AcaoStatus, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  pendente: "Pendente",
  continuo: "Contínuo",
  cancelado: "Cancelado",
}

export const acaoSchema = z.object({
  pgr_id: z.string().uuid(),
  numero_item: z.coerce.number().int().positive(),
  o_que: z.string().min(1, "Descrição obrigatória"),
  quem: z.string().optional().nullable(),
  onde: z.string().optional().nullable(),
  quando: z.string().optional().nullable(),
  por_que: z.string().optional().nullable(),
  como: z.string().optional().nullable(),
  status: z.enum(ACAO_STATUS).default("planejado"),
  observacoes: z.string().optional().nullable(),
})

export type AcaoInput = z.infer<typeof acaoSchema>

// -----------------------------------------------------------------------------
// Medida de Controle (Anexo VI)
// -----------------------------------------------------------------------------

export const TIPO_MEDIDA = ["coletiva", "administrativa", "individual"] as const
export type TipoMedida = (typeof TIPO_MEDIDA)[number]

export const TIPO_MEDIDA_LABEL: Record<TipoMedida, string> = {
  coletiva: "Coletiva",
  administrativa: "Administrativa",
  individual: "Individual (EPI)",
}

/** Hierarquia NIOSH de controles. 1 = mais efetiva (eliminação) → 5 = último recurso (EPI). */
export const NIVEL_NIOSH_LABEL: Record<number, string> = {
  1: "Eliminação",
  2: "Substituição",
  3: "Engenharia",
  4: "Administrativa",
  5: "EPI",
}

export const medidaSchema = z.object({
  pgr_id: z.string().uuid(),
  pgr_ghe_id: z.string().uuid().optional().nullable(),
  agente_ambiental: z.string().optional().nullable(),
  tipo_medida: z.enum(TIPO_MEDIDA),
  nivel_niosh: z.coerce.number().int().min(1).max(5).optional().nullable(),
  acao: z.string().min(1, "Ação obrigatória"),
  detalhamento: z.string().optional().nullable(),
  abrangencia: z.string().optional().nullable(),
  periodicidade: z.string().optional().nullable(),
  status: z.string().default("planejado"),
  ordem: z.coerce.number().int().nonnegative().default(0),
})

export type MedidaInput = z.infer<typeof medidaSchema>

// -----------------------------------------------------------------------------
// EPI × GHE (Anexo VII)
// -----------------------------------------------------------------------------

export const EPI_USO = ["permanente", "eventual", "atividade_especifica"] as const
export type EpiUso = (typeof EPI_USO)[number]

export const EPI_USO_LABEL: Record<EpiUso, string> = {
  permanente: "Permanente",
  eventual: "Eventual",
  atividade_especifica: "Atividade específica",
}

export const epiGheSchema = z.object({
  pgr_ghe_id: z.string().uuid(),
  epi_nome: z.string().min(1, "Nome do EPI obrigatório"),
  epi_id: z.string().uuid().optional().nullable(),
  uso: z.enum(EPI_USO).default("permanente"),
  observacao: z.string().optional().nullable(),
  ordem: z.coerce.number().int().nonnegative().default(0),
})

export type EpiGheInput = z.infer<typeof epiGheSchema>

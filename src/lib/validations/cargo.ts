import { z } from "zod"

/**
 * EPI vinculado a um cargo. Pode ser obrigatório (sempre usar) ou eventual
 * (conforme risco específico). A observação pode ser instrução técnica
 * (ex. "Classe 3 para MT" ou "Quando em solda").
 */
export const epiPorCargoItemSchema = z.object({
  epi_id: z.string().uuid(),
  observacao: z.string().optional().nullable(),
})
export type EpiPorCargoItem = z.infer<typeof epiPorCargoItemSchema>

/**
 * Estrutura do JSONB `cargos.epis_obrigatorios`. Separa obrigatórios
 * (sempre) e eventuais (situações específicas) para refletir a coluna
 * "Medidas Preventivas" da OS NR-01.
 */
export const episPorCargoSchema = z.object({
  obrigatorios: z.array(epiPorCargoItemSchema).default([]),
  eventuais: z.array(epiPorCargoItemSchema).default([]),
})
export type EpisPorCargo = z.infer<typeof episPorCargoSchema>

export const EPIS_POR_CARGO_VAZIO: EpisPorCargo = { obrigatorios: [], eventuais: [] }

export const cargoSchema = z.object({
  empresa_id: z.string().uuid("Empresa obrigatória"),
  titulo: z.string().min(2, "Mínimo 2 caracteres"),
  cbo: z.string().optional().nullable(),
  grupo_risco: z.coerce.number().int().min(1).max(4).optional().nullable(),
  descricao_atividades: z.string().optional().nullable(),
  nrs_aplicaveis: z.array(z.string()).optional().default([]),
  epis_obrigatorios: episPorCargoSchema.optional().nullable(),
})

export type CargoInput = z.infer<typeof cargoSchema>

export const NRS_DISPONIVEIS = [
  "NR-01", "NR-04", "NR-05", "NR-06", "NR-07", "NR-09",
  "NR-10", "NR-11", "NR-12", "NR-17", "NR-18",
  "NR-23", "NR-26", "NR-33", "NR-35",
] as const

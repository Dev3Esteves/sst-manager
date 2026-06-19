import { z } from "zod"

export const epiSchema = z.object({
  descricao: z.string().min(3, "Mínimo 3 caracteres"),
  ca: z.string().min(1, "CA obrigatório"),
  ca_validade: z.string().optional().nullable(),
  fabricante: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  unidade: z.string().min(1).default("un"),
})

export type EpiInput = z.infer<typeof epiSchema>

export const TIPOS_EPI = [
  "capacete", "luva", "bota", "cinto", "protetor_auditivo",
  "oculos", "mascara", "avental", "respirador", "protetor_facial",
] as const

/** Unidades de medida do EPI (estoque). */
export const UNIDADES_EPI = ["un", "par", "cx", "kit", "m", "kg", "frasco", "rolo"] as const

import { z } from "zod"

export const ddsTemaSchema = z.object({
  titulo: z.string().min(3, "Título obrigatório (mín. 3 caracteres)"),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
})
export type DdsTemaInput = z.infer<typeof ddsTemaSchema>

export const DDS_MEDIADOR_TIPOS = ["interno", "externo"] as const

export const ddsMediadorSchema = z.object({
  nome: z.string().min(3, "Nome obrigatório (mín. 3 caracteres)"),
  cargo: z.string().optional().nullable(),
  tipo: z.enum(DDS_MEDIADOR_TIPOS).default("interno"),
  colaborador_id: z.string().uuid().optional().nullable(),
  ativo: z.boolean().default(true),
})
export type DdsMediadorInput = z.infer<typeof ddsMediadorSchema>

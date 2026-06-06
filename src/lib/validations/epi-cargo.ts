import { z } from "zod"

/** Item da matriz EPI×Cargo (um EPI exigido por um cargo). */
export const epiCargoItemSchema = z.object({
  epi_id: z.string().uuid(),
  obrigatorio: z.boolean().default(true),
  observacao: z.string().optional().nullable(),
})

/** Payload para salvar a matriz de um cargo (substitui o conjunto). */
export const matrizCargoSchema = z.object({
  cargo_id: z.string().uuid("Cargo obrigatório"),
  itens: z.array(epiCargoItemSchema),
})

export type EpiCargoItem = z.infer<typeof epiCargoItemSchema>
export type MatrizCargoInput = z.infer<typeof matrizCargoSchema>

import { z } from "zod"

export const epiEntregaSchema = z.object({
  colaborador_id: z.string().uuid("Colaborador obrigatório"),
  epi_id: z.string().uuid("EPI obrigatório"),
  data_entrega: z.string().min(1, "Data obrigatória"),
  quantidade: z.coerce.number().int().min(1).default(1),
  motivo: z.enum(["primeiro_fornecimento", "substituicao", "desgaste", "extravio", "devolucao"]),
  observacoes: z.string().optional().nullable(),
  assinatura_data_url: z.string().optional().nullable(),
  ciencia: z.boolean().optional(),
})

export type EpiEntregaInput = z.infer<typeof epiEntregaSchema>

export const MOTIVOS_LABEL: Record<string, string> = {
  primeiro_fornecimento: "Primeiro fornecimento",
  substituicao: "Substituição",
  desgaste: "Desgaste",
  extravio: "Extravio",
  devolucao: "Devolução",
}

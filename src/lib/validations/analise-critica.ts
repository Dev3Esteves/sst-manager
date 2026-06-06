import { z } from "zod"

export const analiseCriticaSchema = z.object({
  data_reuniao: z.string().min(1, "Data obrigatória"),
  periodo: z.string().optional().nullable(),
  participantes: z.string().optional().nullable(),
  entradas_consideradas: z.string().optional().nullable(),
  desempenho_resumo: z.string().optional().nullable(),
  conclusoes: z.string().optional().nullable(),
  decisoes: z.string().optional().nullable(),
  status: z.enum(["agendada", "realizada"]).default("agendada"),
})

export type AnaliseCriticaInput = z.infer<typeof analiseCriticaSchema>

export const ANALISE_STATUS: Record<string, string> = { agendada: "Agendada", realizada: "Realizada" }

import { z } from "zod"

export const contextoQuestaoSchema = z.object({
  tipo: z.enum(["interna", "externa"]).default("interna"),
  descricao: z.string().min(3, "Descreva a questão"),
})
export type ContextoQuestaoInput = z.infer<typeof contextoQuestaoSchema>

export const parteInteressadaSchema = z.object({
  nome: z.string().min(2, "Informe a parte interessada"),
  tipo: z.enum(["interna", "externa"]).default("externa"),
  necessidades: z.string().optional().nullable(),
  requisitos: z.string().optional().nullable(),
})
export type ParteInteressadaInput = z.infer<typeof parteInteressadaSchema>

export const escopoSchema = z.object({
  conteudo: z.string().min(20, "Descreva o escopo (mín. 20 caracteres)"),
  exclusoes: z.string().optional().nullable(),
  aprovado_por_nome: z.string().optional().nullable(),
  data_aprovacao: z.string().optional().nullable(),
})
export type EscopoInput = z.infer<typeof escopoSchema>

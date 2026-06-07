import { z } from "zod"

export const COMUNICACAO_TIPOS: Record<string, string> = {
  consulta_participacao: "Consulta e participação",
  comunicacao_interna: "Comunicação interna",
  comunicacao_externa: "Comunicação externa",
}

export const comunicacaoSchema = z.object({
  data: z.string().min(1, "Data obrigatória"),
  tipo: z.enum(["consulta_participacao", "comunicacao_interna", "comunicacao_externa"]).default("comunicacao_interna"),
  assunto: z.string().min(3, "Informe o assunto"),
  descricao: z.string().optional().nullable(),
  publico_alvo: z.string().optional().nullable(),
  canal: z.string().optional().nullable(),
  responsavel_nome: z.string().optional().nullable(),
})

export type ComunicacaoInput = z.infer<typeof comunicacaoSchema>

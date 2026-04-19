import { z } from "zod"

export const respostaItemSchema = z.object({
  item_index: z.number().int().min(0),
  pergunta: z.string(),
  grupo: z.string().optional().nullable(),
  conforme: z.enum(["sim", "nao", "na"]),
  observacao: z.string().optional().nullable(),
  foto_url: z.string().optional().nullable(),
})

export const inspecaoSchema = z.object({
  template_id: z.string().uuid("Template obrigatório"),
  empresa_id: z.string().uuid("Empresa obrigatória"),
  inspetor_id: z.string().uuid().optional().nullable(),
  local: z.string().min(1, "Local obrigatório"),
  data_inspecao: z.string().min(1),
  respostas: z.array(respostaItemSchema).min(1, "Responda pelo menos um item"),
  observacoes_gerais: z.string().optional().nullable(),
})

export type InspecaoInput = z.infer<typeof inspecaoSchema>
export type RespostaItem = z.infer<typeof respostaItemSchema>

export type TemplateItem = {
  grupo?: string
  pergunta: string
  tipo_resposta?: string
  nr_referencia?: string
  foto_obrigatoria?: boolean
}

export function calcConformidade(respostas: RespostaItem[]): number {
  const considerados = respostas.filter(r => r.conforme !== "na")
  if (considerados.length === 0) return 100
  const conformes = considerados.filter(r => r.conforme === "sim").length
  return Math.round((conformes / considerados.length) * 10000) / 100
}

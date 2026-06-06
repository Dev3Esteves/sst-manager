import { z } from "zod"

export const respostaItemSchema = z.object({
  item_index: z.number().int().min(0),
  pergunta: z.string(),
  grupo: z.string().optional().nullable(),
  conforme: z.enum(["sim", "nao", "na"]),
  observacao: z.string().optional().nullable(),
  // Foto da não-conformidade: data URL JPEG comprimido (client-side) ou
  // path de Storage. Limite defensivo (~2 MB) para não inflar o JSONB nem
  // o payload da fila offline — a compressão já mantém abaixo disso.
  foto_url: z.string().max(2_000_000, "Foto muito grande").optional().nullable(),
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

// --------------------------------------------------------------------------
// CRUD de TEMPLATES de inspeção (catálogo global — admin/tec_seguranca)
// --------------------------------------------------------------------------

export const templateItemSchema = z.object({
  grupo: z.string().optional().nullable(),
  pergunta: z.string().min(1, "Pergunta obrigatória"),
  tipo_resposta: z.string().optional().nullable(),
  nr_referencia: z.string().optional().nullable(),
  foto_obrigatoria: z.boolean().optional(),
})

export const templateInspecaoSchema = z.object({
  titulo: z.string().min(3, "Título obrigatório (mín. 3 caracteres)"),
  categoria: z.string().optional().nullable(),
  periodicidade: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  itens: z.array(templateItemSchema).min(1, "Adicione pelo menos um item"),
})

export type TemplateInspecaoInput = z.infer<typeof templateInspecaoSchema>

export const PERIODICIDADES: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  sob_demanda: "Sob demanda",
}

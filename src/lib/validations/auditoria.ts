import { z } from "zod"

export const AUDITORIA_STATUS: Record<string, string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
}

export const CONSTATACAO_TIPOS: Record<string, string> = {
  conformidade: "Conformidade",
  nao_conformidade: "Não-conformidade",
  observacao: "Observação",
  oportunidade: "Oportunidade de melhoria",
}

export const auditoriaSchema = z.object({
  titulo: z.string().min(3, "Título obrigatório"),
  escopo: z.string().optional().nullable(),
  criterios: z.string().optional().nullable(),
  auditor_nome: z.string().optional().nullable(),
  obra_id: z.string().uuid().optional().nullable(),
  data_planejada: z.string().optional().nullable(),
  data_realizacao: z.string().optional().nullable(),
  conclusao: z.string().optional().nullable(),
  status: z.enum(["planejada", "em_andamento", "concluida", "cancelada"]).default("planejada"),
})
export type AuditoriaInput = z.infer<typeof auditoriaSchema>

export const constatacaoSchema = z.object({
  auditoria_id: z.string().uuid(),
  tipo: z.enum(["conformidade", "nao_conformidade", "observacao", "oportunidade"]).default("observacao"),
  clausula: z.string().optional().nullable(),
  descricao: z.string().min(3, "Descreva a constatação"),
})
export type ConstatacaoInput = z.infer<typeof constatacaoSchema>

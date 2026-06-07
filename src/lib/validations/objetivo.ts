import { z } from "zod"

export const OBJETIVO_STATUS: Record<string, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  atingido: "Atingido",
  nao_atingido: "Não atingido",
  cancelado: "Cancelado",
}

export const objetivoSchema = z.object({
  titulo: z.string().min(3, "Título obrigatório"),
  descricao: z.string().optional().nullable(),
  indicador: z.string().optional().nullable(),
  meta: z.string().optional().nullable(),
  linha_base: z.string().optional().nullable(),
  valor_atual: z.string().optional().nullable(),
  prazo: z.string().optional().nullable(),
  responsavel_nome: z.string().optional().nullable(),
  recursos: z.string().optional().nullable(),
  status: z.enum(["planejado", "em_andamento", "atingido", "nao_atingido", "cancelado"]).default("planejado"),
})

export type ObjetivoInput = z.infer<typeof objetivoSchema>

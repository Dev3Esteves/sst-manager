import { z } from "zod"

export const MEDICO_STATUS = ["ativo", "inativo", "suspenso"] as const

export const medicoSchema = z.object({
  nome: z.string().min(3, "Nome obrigatório (mín. 3 caracteres)"),
  crm: z.string().min(2, "CRM obrigatório"),
  uf_crm: z.string().max(2, "UF com 2 letras").optional().nullable(),
  especialidade: z.string().optional().nullable(),
  status: z.enum(MEDICO_STATUS).default("ativo"),
  telefone: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")).nullable(),
  observacoes: z.string().optional().nullable(),
})

export type MedicoInput = z.infer<typeof medicoSchema>

export const MEDICO_STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  suspenso: "Suspenso",
}

import { z } from "zod"

export const INSTRUTOR_REGISTRO_TIPOS = ["mte", "crea", "cref", "crm", "outro"] as const

export const instrutorSchema = z.object({
  nome: z.string().min(3, "Nome obrigatório (mín. 3 caracteres)"),
  registro_tipo: z.enum(INSTRUTOR_REGISTRO_TIPOS).optional().nullable(),
  registro_numero: z.string().optional().nullable(),
  formacao: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")).nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
})

export type InstrutorInput = z.infer<typeof instrutorSchema>

export const INSTRUTOR_REGISTRO_LABEL: Record<string, string> = {
  mte: "MTE", crea: "CREA", cref: "CREF", crm: "CRM", outro: "Outro",
}

import { z } from "zod"

export const clinicaSchema = z.object({
  nome: z.string().min(3, "Nome/Razão social obrigatório (mín. 3 caracteres)"),
  nome_fantasia: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  municipio: z.string().optional().nullable(),
  uf: z.string().max(2, "UF com 2 letras").optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")).nullable(),
  ativo: z.boolean().default(true),
})

export type ClinicaInput = z.infer<typeof clinicaSchema>

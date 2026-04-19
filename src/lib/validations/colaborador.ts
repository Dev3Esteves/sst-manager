import { z } from "zod"
import { cpfSchema } from "./shared"

export const colaboradorSchema = z.object({
  empresa_id: z.string().uuid("Empresa obrigatória"),
  nome_completo: z.string().min(3, "Mínimo 3 caracteres"),
  cpf: cpfSchema,
  rg: z.string().optional().nullable(),
  data_nascimento: z.string().optional().nullable(),
  sexo: z.enum(["M", "F", "O"]).optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  cargo_id: z.string().uuid().optional().nullable(),
  obra_id: z.string().uuid().optional().nullable(),
  data_admissao: z.string().min(1, "Data de admissão obrigatória"),
  tipo_vinculo: z.enum(["clt", "pj", "temporario", "estagiario", "terceiro"]),
  matricula: z.string().optional().nullable(),
  status: z.enum(["ativo", "afastado", "ferias", "demitido"]).default("ativo"),
})

export type ColaboradorInput = z.infer<typeof colaboradorSchema>

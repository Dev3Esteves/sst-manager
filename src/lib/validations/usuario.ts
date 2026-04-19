import { z } from "zod"

export const criarUsuarioSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  perfil_id: z.string().uuid("Perfil obrigatório"),
  empresa_id: z.string().uuid("Empresa obrigatória"),
  colaborador_id: z.string().uuid().optional().nullable(),
  ativo: z.boolean().default(true),
})
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>

export const editarUsuarioSchema = z.object({
  perfil_id: z.string().uuid(),
  empresa_id: z.string().uuid(),
  colaborador_id: z.string().uuid().optional().nullable(),
  ativo: z.boolean(),
})
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>

/** Gera senha aleatória forte: 16 chars, letras + números + símbolos. */
export function gerarSenhaForte(): string {
  const lowers = "abcdefghjkmnpqrstuvwxyz" // sem l, i, o
  const uppers = "ABCDEFGHJKMNPQRSTUVWXYZ" // sem I, L, O
  const digits = "23456789" // sem 0, 1
  const symbols = "!@#$%&*+-?"
  const all = lowers + uppers + digits + symbols

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]
  const mandatory = [pick(lowers), pick(uppers), pick(digits), pick(symbols)]
  const rest = Array.from({ length: 12 }, () => pick(all))
  return [...mandatory, ...rest].sort(() => Math.random() - 0.5).join("")
}

import { z } from "zod"

/**
 * Retorna N bytes aleatórios criptograficamente seguros. Usa Web Crypto
 * (`globalThis.crypto.getRandomValues`), disponível em Node ≥15, modernos
 * browsers e Edge runtime — funciona tanto no server quanto no client.
 *
 * Evita importar `node:crypto`, que o webpack do Next tenta carregar no
 * bundle do client e falha com `UnhandledSchemeError`.
 */
function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n)
  globalThis.crypto.getRandomValues(buf)
  return buf
}

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

/**
 * Gera senha aleatória forte usando CSPRNG (`crypto.randomBytes`).
 *
 * Garantias:
 *  - 16 caracteres (≥ 95 bits de entropia com nosso alfabeto de 64+ símbolos)
 *  - Pelo menos 1 letra minúscula, 1 maiúscula, 1 dígito e 1 símbolo
 *  - Alfabetos sem caracteres ambíguos (sem 0, O, l, I, 1)
 *  - Shuffle Fisher-Yates usando CSPRNG (o `sort(Math.random - 0.5)` antigo
 *    tinha viés estatístico conhecido e usava gerador não-criptográfico)
 */
export function gerarSenhaForte(): string {
  const lowers = "abcdefghjkmnpqrstuvwxyz" // sem l, i, o
  const uppers = "ABCDEFGHJKMNPQRSTUVWXYZ" // sem I, L, O
  const digits = "23456789" // sem 0, 1
  const symbols = "!@#$%&*+-?"
  const all = lowers + uppers + digits + symbols

  const pickRandom = (chars: string): string => {
    // Rejection sampling para evitar viés modular (quando 256 % chars.length != 0)
    const max = Math.floor(256 / chars.length) * chars.length
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const b = randomBytes(1)[0]
      if (b < max) return chars[b % chars.length]
    }
  }

  const mandatory = [pickRandom(lowers), pickRandom(uppers), pickRandom(digits), pickRandom(symbols)]
  const rest = Array.from({ length: 12 }, () => pickRandom(all))
  const chars = [...mandatory, ...rest]

  // Fisher-Yates com CSPRNG
  for (let i = chars.length - 1; i > 0; i--) {
    // Índice aleatório uniforme em [0, i] via rejection sampling
    const range = i + 1
    const max = Math.floor(256 / range) * range
    let rnd: number
    do {
      rnd = randomBytes(1)[0]
    } while (rnd >= max)
    const j = rnd % range
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join("")
}

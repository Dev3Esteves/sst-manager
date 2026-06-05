import { timingSafeEqual } from "node:crypto"

/**
 * Autenticação das APIs de LEITURA consumidas pelo Sistenge People.
 * O People envia a chave em `Authorization: Bearer <key>` ou `x-api-key`,
 * validada contra PEOPLE_API_KEY (comparação em tempo constante).
 */
export function verificarApiKeyPeople(req: Request): boolean {
  const esperada = process.env.PEOPLE_API_KEY
  if (!esperada) return false
  const auth = req.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  const recebida = bearer ?? req.headers.get("x-api-key")
  if (!recebida) return false
  const a = Buffer.from(esperada)
  const b = Buffer.from(recebida)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

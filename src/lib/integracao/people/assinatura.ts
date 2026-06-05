import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Assinatura HMAC-SHA256 do corpo do webhook. O People assina o payload bruto
 * com o segredo compartilhado e envia no header; o SST recalcula e compara em
 * tempo constante (anti timing-attack). É a autenticação do webhook.
 */
export function assinarPayload(payloadBruto: string, segredo: string): string {
  return createHmac("sha256", segredo).update(payloadBruto, "utf8").digest("hex")
}

export function verificarAssinatura(
  payloadBruto: string,
  assinaturaRecebida: string | null | undefined,
  segredo: string | undefined,
): boolean {
  if (!assinaturaRecebida || !segredo) return false
  // aceita formato "sha256=<hex>" ou só "<hex>"
  const recebida = assinaturaRecebida.startsWith("sha256=")
    ? assinaturaRecebida.slice(7)
    : assinaturaRecebida
  const esperada = assinarPayload(payloadBruto, segredo)
  const a = Buffer.from(esperada, "hex")
  const b = Buffer.from(recebida, "hex")
  if (a.length === 0 || a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

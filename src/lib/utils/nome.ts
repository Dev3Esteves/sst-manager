/**
 * Utilidades para manipulação de nomes de pessoas.
 */

/**
 * Extrai o primeiro nome de um nome completo.
 * Retorna `null` quando a entrada é vazia, null ou só whitespace.
 *
 * @example primeiroNome("Evandro Ferreira da Silva") // "Evandro"
 * @example primeiroNome("   ") // null
 * @example primeiroNome(null) // null
 */
export function primeiroNome(nomeCompleto: string | null | undefined): string | null {
  if (!nomeCompleto) return null
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return null
  return partes[0]
}

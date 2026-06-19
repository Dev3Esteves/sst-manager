/**
 * Classificação de empresa: "própria" vs "parceiro".
 *
 * - **Própria**: empresa que a Organização opera — é um contexto operacional
 *   (tenant/isolamento) que o usuário pode tornar ativo no switcher.
 * - **Parceiro**: cliente, prestadora, fornecedor, etc. — registro de negócio
 *   gerenciado, NUNCA um contexto operável.
 *
 * Este é o ÚNICO ponto do app que conhece o sinal do schema (`empresas.propria`).
 * Toda a UI deve passar por aqui para não acoplar ao nome da coluna.
 */

/** Coluna/flag canônica no banco que marca uma empresa como própria. */
export const COL_PROPRIA = "propria" as const

export const LABEL_PROPRIA = "Empresa própria"
export const LABEL_PARCEIRO = "Parceiro"

export function ehPropria(
  empresa: { propria?: boolean | null } | null | undefined,
): boolean {
  return empresa?.propria === true
}

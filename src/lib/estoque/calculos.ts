/**
 * Fórmulas de controle de estoque (puras, testáveis).
 * Base: gestão de estoques (ponto de pedido, curva ABC, giro, cobertura).
 */

/** Ponto de pedido = consumo médio diário × lead time + estoque de segurança. */
export function pontoPedido(
  consumoMedioDiario: number,
  leadTimeDias: number,
  estoqueSeguranca: number,
): number {
  return consumoMedioDiario * leadTimeDias + estoqueSeguranca
}

/** Consumo médio diário a partir do total de saídas no período. */
export function consumoMedioDiario(saidasNoPeriodo: number, diasDoPeriodo: number): number {
  if (diasDoPeriodo <= 0) return 0
  return saidasNoPeriodo / diasDoPeriodo
}

/** Cobertura em dias = saldo atual / consumo médio diário. null se consumo 0. */
export function coberturaDias(saldoAtual: number, consumoDiario: number): number | null {
  if (consumoDiario <= 0) return null
  return saldoAtual / consumoDiario
}

/** Giro do estoque = saídas no período / saldo médio. null se saldo médio 0. */
export function giroEstoque(saidasNoPeriodo: number, saldoMedio: number): number | null {
  if (saldoMedio <= 0) return null
  return saidasNoPeriodo / saldoMedio
}

/** Em ruptura quando o saldo cai a/abaixo do ponto de pedido (>0). */
export function emRuptura(saldoAtual: number, pontoPedidoValor: number | null | undefined): boolean {
  if (!pontoPedidoValor || pontoPedidoValor <= 0) return false
  return saldoAtual <= pontoPedidoValor
}

/** Valorização total = soma dos custos totais dos saldos. */
export function valorizacaoTotal(saldos: { custo_total: number | null | undefined }[]): number {
  return saldos.reduce((acc, s) => acc + (Number(s.custo_total) || 0), 0)
}

export type ItemAbc = { id: string; valorConsumido: number }
/**
 * Curva ABC por valor consumido (Pareto): A até 80% acumulado, B até 95%, C resto.
 * Retorna mapa id -> classe. Itens com valor 0 caem em C.
 */
export function curvaAbc(itens: ItemAbc[]): Map<string, "A" | "B" | "C"> {
  const total = itens.reduce((acc, i) => acc + Math.max(0, i.valorConsumido), 0)
  const out = new Map<string, "A" | "B" | "C">()
  if (total <= 0) {
    for (const i of itens) out.set(i.id, "C")
    return out
  }
  const ordenados = [...itens].sort((a, b) => b.valorConsumido - a.valorConsumido)
  let acumulado = 0
  for (const i of ordenados) {
    acumulado += Math.max(0, i.valorConsumido)
    const pct = acumulado / total
    out.set(i.id, pct <= 0.8 ? "A" : pct <= 0.95 ? "B" : "C")
  }
  return out
}

/** Tipos do módulo de estoque de EPIs (espelham o schema; client é tipado frouxo). */

export type TipoLocal = "central" | "obra"
export type TipoMovimentacao =
  | "entrada" | "saida" | "transferencia" | "ajuste" | "perda" | "devolucao"
export type OrigemMovimentacao =
  | "compra" | "entrega" | "devolucao" | "transferencia" | "inventario" | "manual"
export type StatusCompra = "rascunho" | "confirmada" | "cancelada"

export type EstoqueLocal = {
  id: string
  nome: string
  tipo: TipoLocal
  obra_id: string | null
  ativo: boolean
}

export type EstoqueSaldo = {
  id: string
  epi_id: string
  local_id: string
  quantidade: number
  custo_medio: number
  custo_total: number
}

export const TIPO_MOV_LABEL: Record<TipoMovimentacao, string> = {
  entrada: "Entrada",
  saida: "Saída",
  transferencia: "Transferência",
  ajuste: "Ajuste",
  perda: "Perda",
  devolucao: "Devolução",
}

export const STATUS_COMPRA_LABEL: Record<StatusCompra, string> = {
  rascunho: "Rascunho",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
}

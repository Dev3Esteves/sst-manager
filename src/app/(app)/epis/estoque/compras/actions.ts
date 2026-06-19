"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { compraSchema, type CompraInput } from "@/lib/validations/estoque"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormErrors = { _form?: string[] }
type FormResult = { error?: FormErrors } | { ok: true; id: string } | void

/**
 * Cria uma compra em rascunho (cabeçalho + itens).
 * O total é a soma de quantidade × custo_unitário dos itens.
 */
export async function salvarCompra(payload: CompraInput): Promise<FormResult> {
  const parsed = compraSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }

  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const d = parsed.data
  const valorTotal = d.itens.reduce((acc, it) => acc + it.quantidade * it.custo_unitario, 0)

  const { data: compra, error: compraErr } = await supabase
    .from("compra")
    .insert({
      fornecedor_id: d.fornecedor_id,
      local_id: d.local_id,
      nota_fiscal: d.nota_fiscal,
      data_compra: d.data_compra,
      observacao: d.observacao,
      valor_total: valorTotal,
      status: "rascunho",
    })
    .select("id")
    .single()
  if (compraErr || !compra) return { error: { _form: [compraErr?.message || "Falha ao salvar a compra"] } }

  const itens = d.itens.map((it) => ({
    compra_id: compra.id,
    epi_id: it.epi_id,
    lote: it.lote,
    fabricacao: it.fabricacao,
    validade: it.validade,
    quantidade: it.quantidade,
    custo_unitario: it.custo_unitario,
  }))
  const { error: itensErr } = await supabase.from("compra_item").insert(itens)
  if (itensErr) {
    // Desfaz o cabeçalho órfão (cascade apaga itens parciais, se houver).
    await supabase.from("compra").delete().eq("id", compra.id)
    return { error: { _form: [itensErr.message] } }
  }

  revalidatePath("/epis/estoque/compras")
  return { ok: true, id: compra.id }
}

/** Confirma a compra: gera as entradas de estoque via RPC e marca como confirmada. */
export async function confirmarCompra(id: string): Promise<FormResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const { error } = await supabase.rpc("estoque_confirmar_compra", { p_compra_id: id })
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/estoque/compras")
  revalidatePath(`/epis/estoque/compras/${id}`)
  return { ok: true, id }
}

/** Cancela a compra (somente se ainda for rascunho). */
export async function cancelarCompra(id: string): Promise<FormResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const { error } = await supabase
    .from("compra")
    .update({ status: "cancelada" })
    .eq("id", id)
    .eq("status", "rascunho")
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/estoque/compras")
  revalidatePath(`/epis/estoque/compras/${id}`)
  return { ok: true, id }
}

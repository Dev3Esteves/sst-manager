"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormErrors = { _form?: string[] }
type FormResult = { error: FormErrors } | { ok: true; ajustes: number }

export type ContagemItem = {
  epi_id: string
  quantidade_contada: number
}

/**
 * Aplica a contagem de inventário de um local: para cada item contado que
 * diverge do saldo esperado, chama a RPC `estoque_registrar_ajuste` (gera a
 * movimentação de ajuste e atualiza o saldo). Itens sem divergência são ignorados.
 */
export async function aplicarInventario(
  localId: string,
  itens: ContagemItem[],
  observacao: string | null,
): Promise<FormResult> {
  if (!localId) return { error: { _form: ["Selecione um local."] } }

  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const obs = observacao?.trim() || "Ajuste por inventário"
  let ajustes = 0
  for (const item of itens) {
    const qtd = Number(item.quantidade_contada)
    if (!item.epi_id || !Number.isFinite(qtd) || qtd < 0) continue
    const { error } = await supabase.rpc("estoque_registrar_ajuste", {
      p_epi: item.epi_id,
      p_local: localId,
      p_qtd_contada: qtd,
      p_obs: obs,
    })
    if (error) return { error: { _form: [error.message] } }
    ajustes++
  }

  revalidatePath("/epis/estoque/inventario")
  revalidatePath("/epis/estoque")
  revalidatePath("/epis/estoque/kardex")
  return { ok: true, ajustes }
}

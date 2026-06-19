"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { transferenciaSchema, type TransferenciaInput } from "@/lib/validations/estoque"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormErrors = { _form?: string[] }
type FormResult = { error?: FormErrors } | { ok: true } | void

/**
 * Registra uma transferência entre locais via RPC (saída na origem + entrada no
 * destino, transacional). Saldo insuficiente vem como erro de formulário.
 */
export async function transferir(payload: TransferenciaInput): Promise<FormResult> {
  const parsed = transferenciaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }

  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const d = parsed.data
  const { error } = await supabase.rpc("estoque_registrar_transferencia", {
    p_epi: d.epi_id,
    p_local_orig: d.local_orig,
    p_local_dest: d.local_dest,
    p_qtd: d.quantidade,
    p_obs: d.observacao,
  })
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/estoque/transferencias")
  return { ok: true }
}

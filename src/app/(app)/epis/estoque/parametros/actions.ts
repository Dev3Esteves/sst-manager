"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { parametroSchema, type ParametroInput } from "@/lib/validations/estoque"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormErrors = { _form?: string[] }
type FormResult = { error?: FormErrors } | { ok: true }

/**
 * Cria/atualiza os parâmetros de controle de um EPI (opcionalmente por local).
 * Upsert por (epi_id, local_id) — local_id nulo = parâmetro padrão da empresa.
 */
export async function salvarParametro(payload: ParametroInput): Promise<FormResult> {
  const parsed = parametroSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }

  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const d = parsed.data
  const row = {
    epi_id: d.epi_id,
    local_id: d.local_id ?? null,
    estoque_minimo: d.estoque_minimo,
    estoque_maximo: d.estoque_maximo ?? null,
    estoque_seguranca: d.estoque_seguranca,
    lead_time_dias: d.lead_time_dias,
  }
  const { error } = await supabase
    .from("estoque_parametro")
    .upsert(row, { onConflict: "epi_id,local_id" })
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/estoque/parametros")
  revalidatePath("/epis/estoque")
  return { ok: true }
}

/** Remove um parâmetro pelo id. */
export async function excluirParametro(id: string): Promise<FormResult> {
  if (!id) return { error: { _form: ["Parâmetro inválido."] } }

  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const { error } = await supabase.from("estoque_parametro").delete().eq("id", id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/estoque/parametros")
  return { ok: true }
}

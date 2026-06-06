"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { matrizCargoSchema, type MatrizCargoInput } from "@/lib/validations/epi-cargo"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormResult = { error?: { _form: string[] } } | { ok: true }

/**
 * Substitui o conjunto de EPIs obrigatórios de um cargo (matriz EPI×Cargo).
 * Apaga os vínculos atuais do cargo (RLS limita à empresa ativa) e reinsere.
 */
export async function salvarMatrizCargo(payload: MatrizCargoInput): Promise<FormResult> {
  const parsed = matrizCargoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }

  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const { error: delErr } = await supabase.from("epi_cargo").delete().eq("cargo_id", parsed.data.cargo_id)
  if (delErr) return { error: { _form: [delErr.message] } }

  if (parsed.data.itens.length > 0) {
    const rows = parsed.data.itens.map((i) => ({
      cargo_id: parsed.data.cargo_id,
      epi_id: i.epi_id,
      obrigatorio: i.obrigatorio,
      observacao: i.observacao?.trim() || null,
    }))
    const { error: insErr } = await supabase.from("epi_cargo").insert(rows)
    if (insErr) return { error: { _form: [insErr.message] } }
  }

  revalidatePath("/epis/matriz")
  return { ok: true }
}

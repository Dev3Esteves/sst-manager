"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { matrizTreinamentoCargoSchema, type MatrizTreinamentoCargoInput } from "@/lib/validations/treinamento-cargo"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormResult = { error?: { _form: string[] } } | { ok: true }

/** Substitui o conjunto de treinamentos obrigatórios de um cargo. */
export async function salvarMatrizTreinamentoCargo(payload: MatrizTreinamentoCargoInput): Promise<FormResult> {
  const parsed = matrizTreinamentoCargoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }

  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const { error: delErr } = await supabase.from("treinamento_cargo").delete().eq("cargo_id", parsed.data.cargo_id)
  if (delErr) return { error: { _form: [delErr.message] } }

  if (parsed.data.treinamento_ids.length > 0) {
    const rows = parsed.data.treinamento_ids.map((treinamento_id) => ({
      cargo_id: parsed.data.cargo_id,
      treinamento_id,
      obrigatorio: true,
    }))
    const { error: insErr } = await supabase.from("treinamento_cargo").insert(rows)
    if (insErr) return { error: { _form: [insErr.message] } }
  }

  revalidatePath("/treinamentos/matriz")
  return { ok: true }
}

"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { localSchema, type LocalInput } from "@/lib/validations/estoque"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormResult = { error?: { _form: string[] } } | { ok: true }

async function authed() {
  return requireRole(ROLES)
}

/** Cria um novo local de estoque (central ou de obra). */
export async function criarLocal(payload: LocalInput): Promise<FormResult> {
  const parsed = localSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }

  let supabase
  try {
    ;({ supabase } = await authed())
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const { error } = await supabase.from("estoque_local").insert({
    nome: parsed.data.nome.trim(),
    tipo: parsed.data.tipo,
    obra_id: parsed.data.obra_id ?? null,
    ativo: parsed.data.ativo,
  })
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/estoque/locais")
  return { ok: true }
}

/** Atualiza um local existente. */
export async function atualizarLocal(id: string, payload: LocalInput): Promise<FormResult> {
  const parsed = localSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }

  let supabase
  try {
    ;({ supabase } = await authed())
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const { error } = await supabase
    .from("estoque_local")
    .update({
      nome: parsed.data.nome.trim(),
      tipo: parsed.data.tipo,
      obra_id: parsed.data.obra_id ?? null,
      ativo: parsed.data.ativo,
    })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/estoque/locais")
  return { ok: true }
}

/** Inativa um local (não apaga: mantém histórico de saldos/movimentos). */
export async function inativarLocal(id: string): Promise<FormResult> {
  let supabase
  try {
    ;({ supabase } = await authed())
  } catch (e) {
    if (e instanceof AuthError) return { error: { _form: [e.message] } }
    throw e
  }

  const { error } = await supabase.from("estoque_local").update({ ativo: false }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/estoque/locais")
  return { ok: true }
}

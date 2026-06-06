"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { ddsTemaSchema, ddsMediadorSchema, type DdsTemaInput, type DdsMediadorInput } from "@/lib/validations/dds-catalogo"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg", "encarregado_campo"] as const
type FormResult = { error?: { _form: string[] } } | { ok: true }

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

// ---- Temas ----
export async function createDdsTema(payload: DdsTemaInput): Promise<FormResult> {
  const parsed = ddsTemaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("dds_temas").insert({
    titulo: parsed.data.titulo.trim(),
    descricao: parsed.data.descricao?.trim() || null,
    ativo: parsed.data.ativo,
  })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/dds-catalogo")
  return { ok: true }
}

export async function toggleDdsTema(id: string, ativo: boolean): Promise<FormResult> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("dds_temas").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/dds-catalogo")
  return { ok: true }
}

// ---- Mediadores ----
export async function createDdsMediador(payload: DdsMediadorInput): Promise<FormResult> {
  const parsed = ddsMediadorSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("dds_mediadores").insert({
    nome: parsed.data.nome.trim(),
    cargo: parsed.data.cargo?.trim() || null,
    tipo: parsed.data.tipo,
    colaborador_id: parsed.data.colaborador_id || null,
    ativo: parsed.data.ativo,
  })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/dds-catalogo")
  return { ok: true }
}

export async function toggleDdsMediador(id: string, ativo: boolean): Promise<FormResult> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("dds_mediadores").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/dds-catalogo")
  return { ok: true }
}

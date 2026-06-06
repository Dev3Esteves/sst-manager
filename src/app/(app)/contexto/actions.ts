"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { contextoQuestaoSchema, parteInteressadaSchema, type ContextoQuestaoInput, type ParteInteressadaInput } from "@/lib/validations/contexto"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
type R = { error?: { _form: string[] } } | { ok: true }

function authError(e: unknown): R {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

export async function createQuestao(payload: ContextoQuestaoInput): Promise<R> {
  const parsed = contextoQuestaoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("contexto_questao").insert({ tipo: parsed.data.tipo, descricao: parsed.data.descricao.trim() })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto"); revalidatePath("/iso-45001")
  return { ok: true }
}

export async function toggleQuestao(id: string, ativo: boolean): Promise<R> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("contexto_questao").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto")
  return { ok: true }
}

export async function createParte(payload: ParteInteressadaInput): Promise<R> {
  const parsed = parteInteressadaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("parte_interessada").insert({
    nome: parsed.data.nome.trim(),
    tipo: parsed.data.tipo,
    necessidades: parsed.data.necessidades?.trim() || null,
    requisitos: parsed.data.requisitos?.trim() || null,
  })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto"); revalidatePath("/iso-45001")
  return { ok: true }
}

export async function toggleParte(id: string, ativo: boolean): Promise<R> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("parte_interessada").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto")
  return { ok: true }
}

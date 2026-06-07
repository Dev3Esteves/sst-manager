"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { auditoriaSchema, constatacaoSchema, type AuditoriaInput, type ConstatacaoInput } from "@/lib/validations/auditoria"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
type FormResult = { error?: { _form: string[] } } | void
type R = { error?: { _form: string[] } } | { ok: true }

function authError<T>(e: unknown): T {
  if (e instanceof AuthError) return { error: { _form: [e.message] } } as T
  throw e
}

function toRow(d: AuditoriaInput) {
  const t = (v: string | null | undefined) => v?.trim() || null
  return {
    titulo: d.titulo.trim(),
    escopo: t(d.escopo),
    criterios: t(d.criterios),
    auditor_nome: t(d.auditor_nome),
    obra_id: d.obra_id || null,
    data_planejada: d.data_planejada || null,
    data_realizacao: d.data_realizacao || null,
    conclusao: t(d.conclusao),
    status: d.status,
  }
}

export async function createAuditoria(payload: AuditoriaInput): Promise<FormResult> {
  const parsed = auditoriaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { data, error } = await supabase.from("auditoria").insert(toRow(parsed.data)).select("id").single()
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/auditorias"); revalidatePath("/iso-45001")
  redirect(`/auditorias/${data.id}`)
}

export async function updateAuditoria(id: string, payload: AuditoriaInput): Promise<FormResult> {
  const parsed = auditoriaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("auditoria").update({ ...toRow(parsed.data), updated_at: new Date().toISOString() }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/auditorias"); revalidatePath(`/auditorias/${id}`)
  redirect("/auditorias")
}

export async function addConstatacao(payload: ConstatacaoInput): Promise<R> {
  const parsed = constatacaoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("auditoria_constatacao").insert({
    auditoria_id: parsed.data.auditoria_id,
    tipo: parsed.data.tipo,
    clausula: parsed.data.clausula?.trim() || null,
    descricao: parsed.data.descricao.trim(),
  })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/auditorias/${parsed.data.auditoria_id}`)
  return { ok: true }
}

export async function removeConstatacao(id: string, auditoriaId: string): Promise<R> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("auditoria_constatacao").delete().eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/auditorias/${auditoriaId}`)
  return { ok: true }
}

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { objetivoSchema, type ObjetivoInput } from "@/lib/validations/objetivo"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: ObjetivoInput) {
  const t = (v: string | null | undefined) => v?.trim() || null
  return {
    titulo: d.titulo.trim(),
    descricao: t(d.descricao),
    indicador: t(d.indicador),
    meta: t(d.meta),
    linha_base: t(d.linha_base),
    valor_atual: t(d.valor_atual),
    prazo: d.prazo || null,
    responsavel_nome: t(d.responsavel_nome),
    recursos: t(d.recursos),
    status: d.status,
  }
}

export async function createObjetivo(payload: ObjetivoInput): Promise<FormResult> {
  const parsed = objetivoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("objetivo_sst").insert(toRow(parsed.data))
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/objetivos"); revalidatePath("/iso-45001")
  redirect("/objetivos")
}

export async function updateObjetivo(id: string, payload: ObjetivoInput): Promise<FormResult> {
  const parsed = objetivoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("objetivo_sst")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/objetivos")
  redirect("/objetivos")
}

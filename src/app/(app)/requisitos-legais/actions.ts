"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { requisitoLegalSchema, type RequisitoLegalInput } from "@/lib/validations/requisito-legal"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: RequisitoLegalInput) {
  const t = (v: string | null | undefined) => v?.trim() || null
  return {
    tipo: d.tipo,
    referencia: d.referencia.trim(),
    titulo: t(d.titulo),
    aplicabilidade: t(d.aplicabilidade),
    atende: d.atende === "sim" ? true : d.atende === "nao" ? false : null,
    evidencia: t(d.evidencia),
    responsavel_nome: t(d.responsavel_nome),
    data_avaliacao: d.data_avaliacao || null,
    ativo: d.ativo,
  }
}

export async function createRequisito(payload: RequisitoLegalInput): Promise<FormResult> {
  const parsed = requisitoLegalSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("requisito_legal").insert(toRow(parsed.data))
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/requisitos-legais"); revalidatePath("/iso-45001")
  redirect("/requisitos-legais")
}

export async function updateRequisito(id: string, payload: RequisitoLegalInput): Promise<FormResult> {
  const parsed = requisitoLegalSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("requisito_legal")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/requisitos-legais")
  redirect("/requisitos-legais")
}

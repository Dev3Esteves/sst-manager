"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { instrutorSchema, type InstrutorInput } from "@/lib/validations/instrutor"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: InstrutorInput) {
  const t = (v: string | null | undefined) => v?.trim() || null
  return {
    nome: d.nome.trim(),
    registro_tipo: d.registro_tipo || null,
    registro_numero: t(d.registro_numero),
    formacao: t(d.formacao),
    telefone: t(d.telefone),
    email: t(d.email),
    observacoes: t(d.observacoes),
    ativo: d.ativo,
  }
}

export async function createInstrutor(payload: InstrutorInput): Promise<FormResult> {
  const parsed = instrutorSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("instrutores").insert(toRow(parsed.data))
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/instrutores")
  redirect("/instrutores")
}

export async function updateInstrutor(id: string, payload: InstrutorInput): Promise<FormResult> {
  const parsed = instrutorSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("instrutores")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/instrutores")
  redirect("/instrutores")
}

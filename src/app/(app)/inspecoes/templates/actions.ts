"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { templateInspecaoSchema, type TemplateInspecaoInput } from "@/lib/validations/inspecao"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const

type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

export async function createTemplateInspecao(payload: TemplateInspecaoInput): Promise<FormResult> {
  const parsed = templateInspecaoSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase.from("templates_inspecao").insert({
    titulo: parsed.data.titulo,
    categoria: parsed.data.categoria || null,
    periodicidade: parsed.data.periodicidade || null,
    ativo: parsed.data.ativo,
    itens: parsed.data.itens,
  })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/inspecoes/templates")
  redirect(`/inspecoes/templates`)
}

export async function updateTemplateInspecao(id: string, payload: TemplateInspecaoInput): Promise<FormResult> {
  const parsed = templateInspecaoSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase
    .from("templates_inspecao")
    .update({
      titulo: parsed.data.titulo,
      categoria: parsed.data.categoria || null,
      periodicidade: parsed.data.periodicidade || null,
      ativo: parsed.data.ativo,
      itens: parsed.data.itens,
    })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/inspecoes/templates")
  redirect(`/inspecoes/templates`)
}

export async function toggleTemplateInspecaoAtivo(id: string, ativo: boolean): Promise<FormResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase.from("templates_inspecao").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/inspecoes/templates")
}

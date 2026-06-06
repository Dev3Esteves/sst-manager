"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { medicoSchema, type MedicoInput } from "@/lib/validations/medico"

const ROLES = ["admin", "tec_seguranca", "rh_administrativo"] as const

type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: MedicoInput) {
  return {
    nome: d.nome.trim(),
    crm: d.crm.trim(),
    uf_crm: d.uf_crm ? d.uf_crm.trim().toUpperCase() : null,
    especialidade: d.especialidade?.trim() || null,
    status: d.status,
    telefone: d.telefone?.trim() || null,
    email: d.email?.trim() || null,
    observacoes: d.observacoes?.trim() || null,
  }
}

export async function createMedico(payload: MedicoInput): Promise<FormResult> {
  const parsed = medicoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase.from("medicos").insert(toRow(parsed.data))
  if (error) {
    const msg = error.code === "23505" ? "Já existe um médico com este CRM nesta empresa." : error.message
    return { error: { _form: [msg] } }
  }
  revalidatePath("/medicos")
  redirect("/medicos")
}

export async function updateMedico(id: string, payload: MedicoInput): Promise<FormResult> {
  const parsed = medicoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase
    .from("medicos")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) {
    const msg = error.code === "23505" ? "Já existe um médico com este CRM nesta empresa." : error.message
    return { error: { _form: [msg] } }
  }
  revalidatePath("/medicos")
  redirect("/medicos")
}

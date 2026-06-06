"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { clinicaSchema, type ClinicaInput } from "@/lib/validations/clinica"

const ROLES = ["admin", "tec_seguranca", "rh_administrativo"] as const

type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: ClinicaInput) {
  const t = (v: string | null | undefined) => v?.trim() || null
  return {
    nome: d.nome.trim(),
    nome_fantasia: t(d.nome_fantasia),
    cnpj: d.cnpj ? d.cnpj.replace(/\D/g, "") || null : null,
    cep: d.cep ? d.cep.replace(/\D/g, "") || null : null,
    logradouro: t(d.logradouro),
    numero: t(d.numero),
    complemento: t(d.complemento),
    bairro: t(d.bairro),
    municipio: t(d.municipio),
    uf: d.uf ? d.uf.trim().toUpperCase() : null,
    telefone: t(d.telefone),
    email: t(d.email),
    ativo: d.ativo,
  }
}

export async function createClinica(payload: ClinicaInput): Promise<FormResult> {
  const parsed = clinicaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase.from("clinicas").insert(toRow(parsed.data))
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/clinicas")
  redirect("/clinicas")
}

export async function updateClinica(id: string, payload: ClinicaInput): Promise<FormResult> {
  const parsed = clinicaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase
    .from("clinicas")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/clinicas")
  redirect("/clinicas")
}

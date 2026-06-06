"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { entidadeTreinamentoSchema, type EntidadeTreinamentoInput } from "@/lib/validations/entidade-treinamento"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const
type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: EntidadeTreinamentoInput) {
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

export async function createEntidade(payload: EntidadeTreinamentoInput): Promise<FormResult> {
  const parsed = entidadeTreinamentoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("entidades_treinamento").insert(toRow(parsed.data))
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/entidades-treinamento")
  redirect("/entidades-treinamento")
}

export async function updateEntidade(id: string, payload: EntidadeTreinamentoInput): Promise<FormResult> {
  const parsed = entidadeTreinamentoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("entidades_treinamento")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/entidades-treinamento")
  redirect("/entidades-treinamento")
}

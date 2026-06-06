"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { templateOcorrenciaSchema, type TemplateOcorrenciaInput } from "@/lib/validations/ocorrencia"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const

type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: TemplateOcorrenciaInput) {
  return {
    tipo: d.tipo,
    titulo: d.titulo,
    descricao_modelo: d.descricao_modelo || null,
    gravidade_sugerida: d.gravidade_sugerida || null,
    natureza_lesao_sugerida: d.natureza_lesao_sugerida || null,
    agente_causador_sugerido: d.agente_causador_sugerido || null,
    roteiro_investigacao: d.roteiro_investigacao && d.roteiro_investigacao.length > 0 ? d.roteiro_investigacao : null,
    ativo: d.ativo,
  }
}

export async function createTemplateOcorrencia(payload: TemplateOcorrenciaInput): Promise<FormResult> {
  const parsed = templateOcorrenciaSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase.from("templates_ocorrencia").insert({ ...toRow(parsed.data), is_sistema: false })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/ocorrencias/templates")
  redirect("/ocorrencias/templates")
}

export async function updateTemplateOcorrencia(id: string, payload: TemplateOcorrenciaInput): Promise<FormResult> {
  const parsed = templateOcorrenciaSchema.safeParse(payload)
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
    .from("templates_ocorrencia")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/ocorrencias/templates")
  redirect("/ocorrencias/templates")
}

export async function toggleTemplateOcorrenciaAtivo(id: string, ativo: boolean): Promise<FormResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { error } = await supabase.from("templates_ocorrencia").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/ocorrencias/templates")
}

/**
 * Reverte um template de sistema ao seu padrão de fábrica (snapshot em `padrao`).
 * Só faz sentido para templates com is_sistema = true.
 */
export async function reverterTemplateOcorrencia(id: string): Promise<FormResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return authError(e)
  }
  const { data: tpl, error: readErr } = await supabase
    .from("templates_ocorrencia")
    .select("padrao, is_sistema")
    .eq("id", id)
    .single()
  if (readErr) return { error: { _form: [readErr.message] } }
  if (!tpl?.is_sistema || !tpl.padrao) {
    return { error: { _form: ["Este template não possui padrão de fábrica para reverter."] } }
  }
  const p = tpl.padrao as Record<string, unknown>
  const { error } = await supabase
    .from("templates_ocorrencia")
    .update({
      titulo: p.titulo ?? null,
      descricao_modelo: p.descricao_modelo ?? null,
      gravidade_sugerida: p.gravidade_sugerida ?? null,
      natureza_lesao_sugerida: p.natureza_lesao_sugerida ?? null,
      agente_causador_sugerido: p.agente_causador_sugerido ?? null,
      roteiro_investigacao: p.roteiro_investigacao ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/ocorrencias/templates")
  revalidatePath(`/ocorrencias/templates/${id}`)
}

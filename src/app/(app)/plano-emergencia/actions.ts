"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { planoEmergenciaSchema, type PlanoEmergenciaInput } from "@/lib/validations/plano-emergencia"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "encarregado_campo"] as const
type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: PlanoEmergenciaInput) {
  const t = (v: string | null | undefined) => v?.trim() || null
  return {
    titulo: d.titulo.trim(),
    cenario: d.cenario,
    obra_id: d.obra_id || null,
    descricao: t(d.descricao),
    procedimento_resposta: t(d.procedimento_resposta),
    recursos: t(d.recursos),
    brigada_responsavel: t(d.brigada_responsavel),
    contatos_emergencia: t(d.contatos_emergencia),
    ultimo_simulado: d.ultimo_simulado || null,
    proximo_simulado: d.proximo_simulado || null,
    licoes_aprendidas: t(d.licoes_aprendidas),
    data_revisao: d.data_revisao || null,
    status: d.status,
  }
}

export async function createPlano(payload: PlanoEmergenciaInput): Promise<FormResult> {
  const parsed = planoEmergenciaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("plano_emergencia").insert(toRow(parsed.data))
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/plano-emergencia"); revalidatePath("/iso-45001")
  redirect("/plano-emergencia")
}

export async function updatePlano(id: string, payload: PlanoEmergenciaInput): Promise<FormResult> {
  const parsed = planoEmergenciaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("plano_emergencia")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/plano-emergencia")
  redirect("/plano-emergencia")
}

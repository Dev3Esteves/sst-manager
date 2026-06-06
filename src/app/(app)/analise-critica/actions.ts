"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { analiseCriticaSchema, type AnaliseCriticaInput } from "@/lib/validations/analise-critica"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: AnaliseCriticaInput) {
  const t = (v: string | null | undefined) => v?.trim() || null
  return {
    data_reuniao: d.data_reuniao,
    periodo: t(d.periodo),
    participantes: t(d.participantes),
    entradas_consideradas: t(d.entradas_consideradas),
    desempenho_resumo: t(d.desempenho_resumo),
    conclusoes: t(d.conclusoes),
    decisoes: t(d.decisoes),
    status: d.status,
  }
}

export async function createAnalise(payload: AnaliseCriticaInput): Promise<FormResult> {
  const parsed = analiseCriticaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("analise_critica").insert(toRow(parsed.data))
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/analise-critica"); revalidatePath("/iso-45001")
  redirect("/analise-critica")
}

export async function updateAnalise(id: string, payload: AnaliseCriticaInput): Promise<FormResult> {
  const parsed = analiseCriticaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("analise_critica")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/analise-critica")
  redirect("/analise-critica")
}

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, requireAuth, AuthError } from "@/lib/auth/guards"
import { politicaSchema, type PoliticaInput } from "@/lib/validations/politica"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: PoliticaInput) {
  return {
    titulo: d.titulo.trim(),
    conteudo: d.conteudo.trim(),
    compromisso_condicoes_seguras: d.compromisso_condicoes_seguras,
    compromisso_requisitos_legais: d.compromisso_requisitos_legais,
    compromisso_eliminar_riscos: d.compromisso_eliminar_riscos,
    compromisso_melhoria_continua: d.compromisso_melhoria_continua,
    compromisso_participacao: d.compromisso_participacao,
    aprovado_por_nome: d.aprovado_por_nome?.trim() || null,
    aprovado_por_cargo: d.aprovado_por_cargo?.trim() || null,
    data_aprovacao: d.data_aprovacao || null,
    publica: d.publica,
  }
}

export async function createPolitica(payload: PoliticaInput): Promise<FormResult> {
  const parsed = politicaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { data: ult } = await supabase
    .from("politica_sst")
    .select("numero_revisao")
    .order("numero_revisao", { ascending: false })
    .limit(1)
    .maybeSingle()
  const numero_revisao = ((ult?.numero_revisao as number | undefined) ?? -1) + 1
  const { error } = await supabase.from("politica_sst").insert({ ...toRow(parsed.data), numero_revisao })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/politica")
  redirect("/politica")
}

export async function updatePolitica(id: string, payload: PoliticaInput): Promise<FormResult> {
  const parsed = politicaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("politica_sst")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/politica")
  redirect("/politica")
}

/** Torna a revisão vigente (e marca as demais como substituídas). */
export async function publicarPolitica(id: string): Promise<FormResult> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  // Substitui as vigentes anteriores da empresa (RLS limita à empresa ativa).
  const { error: subErr } = await supabase
    .from("politica_sst")
    .update({ status: "substituida" })
    .eq("status", "vigente")
  if (subErr) return { error: { _form: [subErr.message] } }
  const { error } = await supabase
    .from("politica_sst")
    .update({ status: "vigente", data_publicacao: hojeBrasilia(), publica: true, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/politica")
  revalidatePath("/iso-45001")
}

/** Registra a ciência do usuário atual sobre a política vigente. */
export async function darCienciaPolitica(politicaId: string): Promise<FormResult> {
  let supabase, user
  try { ;({ supabase, user } = await requireAuth()) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("politica_sst_ciencia")
    .upsert({ politica_id: politicaId, usuario_id: user.id }, { onConflict: "politica_id,usuario_id" })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/politica")
}

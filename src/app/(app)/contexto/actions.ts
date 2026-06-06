"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { contextoQuestaoSchema, parteInteressadaSchema, escopoSchema, type ContextoQuestaoInput, type ParteInteressadaInput, type EscopoInput } from "@/lib/validations/contexto"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
type R = { error?: { _form: string[] } } | { ok: true }

function authError(e: unknown): R {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

export async function createQuestao(payload: ContextoQuestaoInput): Promise<R> {
  const parsed = contextoQuestaoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("contexto_questao").insert({ tipo: parsed.data.tipo, descricao: parsed.data.descricao.trim() })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto"); revalidatePath("/iso-45001")
  return { ok: true }
}

export async function toggleQuestao(id: string, ativo: boolean): Promise<R> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("contexto_questao").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto")
  return { ok: true }
}

export async function createParte(payload: ParteInteressadaInput): Promise<R> {
  const parsed = parteInteressadaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("parte_interessada").insert({
    nome: parsed.data.nome.trim(),
    tipo: parsed.data.tipo,
    necessidades: parsed.data.necessidades?.trim() || null,
    requisitos: parsed.data.requisitos?.trim() || null,
  })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto"); revalidatePath("/iso-45001")
  return { ok: true }
}

export async function toggleParte(id: string, ativo: boolean): Promise<R> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("parte_interessada").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto")
  return { ok: true }
}

export async function salvarEscopo(payload: EscopoInput): Promise<R> {
  const parsed = escopoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const row = {
    conteudo: parsed.data.conteudo.trim(),
    exclusoes: parsed.data.exclusoes?.trim() || null,
    aprovado_por_nome: parsed.data.aprovado_por_nome?.trim() || null,
    data_aprovacao: parsed.data.data_aprovacao || null,
  }
  // Um escopo por empresa: atualiza o existente ou cria (empresa_id via DEFAULT).
  const { data: existente } = await supabase.from("escopo_sgsst").select("id").maybeSingle()
  const { error } = existente
    ? await supabase.from("escopo_sgsst").update({ ...row, updated_at: new Date().toISOString() }).eq("id", existente.id)
    : await supabase.from("escopo_sgsst").insert(row)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/contexto"); revalidatePath("/iso-45001")
  return { ok: true }
}

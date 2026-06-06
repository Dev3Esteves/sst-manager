"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { gestaoMudancaSchema, type GestaoMudancaInput } from "@/lib/validations/gestao-mudanca"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
type FormResult = { error?: { _form: string[] } } | void

function authError(e: unknown): FormResult {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

function toRow(d: GestaoMudancaInput) {
  const t = (v: string | null | undefined) => v?.trim() || null
  return {
    titulo: d.titulo.trim(),
    descricao: d.descricao.trim(),
    tipo: d.tipo,
    carater: d.carater,
    motivo: t(d.motivo),
    data_prevista: d.data_prevista || null,
    obra_id: d.obra_id || null,
    perigos_riscos: t(d.perigos_riscos),
    medidas_controle: t(d.medidas_controle),
    comunicacao: t(d.comunicacao),
    data_implementacao: d.data_implementacao || null,
    avaliacao_pos: t(d.avaliacao_pos),
    responsavel_nome: t(d.responsavel_nome),
    envolve_aquisicao: d.envolve_aquisicao,
    criterios_aquisicao: t(d.criterios_aquisicao),
    adkar_consciencia: t(d.adkar_consciencia),
    adkar_desejo: t(d.adkar_desejo),
    adkar_conhecimento: t(d.adkar_conhecimento),
    adkar_habilidade: t(d.adkar_habilidade),
    adkar_reforco: t(d.adkar_reforco),
    status: d.status,
  }
}

export async function createMudanca(payload: GestaoMudancaInput): Promise<FormResult> {
  const parsed = gestaoMudancaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("gestao_mudanca").insert(toRow(parsed.data))
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/gestao-mudanca")
  revalidatePath("/iso-45001")
  redirect("/gestao-mudanca")
}

export async function updateMudanca(id: string, payload: GestaoMudancaInput): Promise<FormResult> {
  const parsed = gestaoMudancaSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase
    .from("gestao_mudanca")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/gestao-mudanca")
  redirect("/gestao-mudanca")
}

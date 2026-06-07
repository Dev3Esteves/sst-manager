"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { comunicacaoSchema, type ComunicacaoInput } from "@/lib/validations/comunicacao"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria", "encarregado_campo"] as const
type R = { error?: { _form: string[] } } | { ok: true }

function authError(e: unknown): R {
  if (e instanceof AuthError) return { error: { _form: [e.message] } }
  throw e
}

export async function createComunicacao(payload: ComunicacaoInput): Promise<R> {
  const parsed = comunicacaoSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const t = (v: string | null | undefined) => v?.trim() || null
  const { error } = await supabase.from("registro_comunicacao").insert({
    data: parsed.data.data,
    tipo: parsed.data.tipo,
    assunto: parsed.data.assunto.trim(),
    descricao: t(parsed.data.descricao),
    publico_alvo: t(parsed.data.publico_alvo),
    canal: t(parsed.data.canal),
    responsavel_nome: t(parsed.data.responsavel_nome),
  })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/comunicacao"); revalidatePath("/iso-45001")
  return { ok: true }
}

export async function toggleComunicacao(id: string, ativo: boolean): Promise<R> {
  let supabase
  try { ;({ supabase } = await requireRole(ROLES)) } catch (e) { return authError(e) }
  const { error } = await supabase.from("registro_comunicacao").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/comunicacao")
  return { ok: true }
}

"use server"

import { revalidatePath } from "next/cache"
import { requireRole, AuthError } from "@/lib/auth/guards"

type Result = { error: string } | { ok: true }

function fail(e: unknown): Result {
  if (e instanceof AuthError) return { error: e.message }
  throw e
}

/** Liga/desliga a trava e ajusta a carência. Ao ligar (off→on), reinicia a carência. */
export async function salvarTravaConfig(input: { trava_ativa: boolean; carencia_dias: number }): Promise<Result> {
  let supabase
  try { ({ supabase } = await requireRole(["admin"])) } catch (e) { return fail(e) }

  const carencia = Number.isFinite(input.carencia_dias) ? Math.max(0, Math.trunc(input.carencia_dias)) : 0

  const { data: atual } = await supabase
    .from("treinamento_config")
    .select("trava_ativa, data_ativacao")
    .eq("id", true)
    .maybeSingle()

  const ligandoAgora = input.trava_ativa && !atual?.trava_ativa
  const patch: Record<string, unknown> = {
    id: true,
    trava_ativa: input.trava_ativa,
    carencia_dias: carencia,
    updated_at: new Date().toISOString(),
  }
  // Reinicia a carência sempre que a trava é (re)ligada.
  if (ligandoAgora) patch.data_ativacao = new Date().toISOString()

  const { error } = await supabase.from("treinamento_config").upsert(patch, { onConflict: "id" })
  if (error) return { error: error.message }
  revalidatePath("/admin/treinamento")
  return { ok: true }
}

/** Isenta um usuário de um módulo ('*' = todos). */
export async function adicionarIsencao(input: { usuario_id: string; modulo_slug: string; motivo?: string }): Promise<Result> {
  let supabase, user
  try { ({ supabase, user } = await requireRole(["admin"])) } catch (e) { return fail(e) }
  if (!input.usuario_id) return { error: "Selecione um usuário." }
  const slug = input.modulo_slug || "*"
  const { error } = await supabase.from("treinamento_isencao").upsert(
    { usuario_id: input.usuario_id, modulo_slug: slug, motivo: input.motivo || null, created_by: user.id },
    { onConflict: "usuario_id,modulo_slug" },
  )
  if (error) return { error: error.message }
  revalidatePath("/admin/treinamento")
  return { ok: true }
}

export async function removerIsencao(id: string): Promise<Result> {
  let supabase
  try { ({ supabase } = await requireRole(["admin"])) } catch (e) { return fail(e) }
  const { error } = await supabase.from("treinamento_isencao").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/admin/treinamento")
  return { ok: true }
}

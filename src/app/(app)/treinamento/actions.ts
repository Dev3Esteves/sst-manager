"use server"

import { revalidatePath } from "next/cache"
import { requireAuth, AuthError } from "@/lib/auth/guards"
import { getModulo } from "@/lib/treinamento/trilha"

type Result = { error?: string } | { ok: true }

/** Marca um módulo da trilha como concluído para o usuário atual. */
export async function concluirModulo(slug: string): Promise<Result> {
  if (!getModulo(slug)) return { error: "Módulo inválido" }
  let supabase, user
  try {
    ;({ supabase, user } = await requireAuth())
  } catch (e) {
    if (e instanceof AuthError) return { error: e.message }
    throw e
  }
  const { error } = await supabase
    .from("treinamento_sistema_progresso")
    .upsert({ usuario_id: user.id, modulo_slug: slug }, { onConflict: "usuario_id,modulo_slug" })
  if (error) return { error: error.message }
  revalidatePath("/treinamento")
  revalidatePath(`/treinamento/${slug}`)
  return { ok: true }
}

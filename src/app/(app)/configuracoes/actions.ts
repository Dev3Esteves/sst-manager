"use server"

import { requireAuth } from "@/lib/auth/guards"
import { trocarSenhaSchema } from "@/lib/validations/configuracoes"

type ActionResult = { ok: true } | { error: Record<string, string[] | undefined> & { _form?: string[] } }

/**
 * Troca a senha do próprio usuário logado via Supabase Auth.
 * Qualquer usuário autenticado pode trocar a SUA senha.
 */
export async function trocarSenha(formData: FormData): Promise<ActionResult> {
  let supabase
  try {
    ;({ supabase } = await requireAuth())
  } catch {
    return { error: { _form: ["Sessão expirada. Faça login novamente."] } }
  }

  const parsed = trocarSenhaSchema.safeParse({
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha })
  if (error) return { error: { _form: [error.message] } }

  return { ok: true }
}

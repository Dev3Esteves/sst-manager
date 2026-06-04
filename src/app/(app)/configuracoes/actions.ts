"use server"

import { revalidatePath } from "next/cache"
import { requireAuth, requireAdmin } from "@/lib/auth/guards"
import { trocarSenhaSchema, templateCertificadoSchema } from "@/lib/validations/configuracoes"

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

/**
 * Salva o template padrão de certificado na empresa-dona da organização.
 * Restrito a admin. String vazia volta a coluna para null (usa o padrão).
 */
export async function salvarTemplateCertificado(
  empresaId: string,
  formData: FormData,
): Promise<ActionResult> {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch {
    return { error: { _form: ["Apenas administradores podem alterar o template."] } }
  }

  const raw = (formData.get("template_certificado") as string | null)?.trim() || null
  const parsed = templateCertificadoSchema.safeParse({ template_certificado: raw })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { error } = await supabase
    .from("empresas")
    .update({ template_certificado: parsed.data.template_certificado })
    .eq("id", empresaId)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/configuracoes")
  return { ok: true }
}

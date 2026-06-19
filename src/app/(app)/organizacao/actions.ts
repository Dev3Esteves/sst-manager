"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/guards"
import { uploadLogo } from "@/lib/storage/upload-logo"
import { templateCertificadoSchema } from "@/lib/validations/configuracoes"

type ActionResult = { ok: true } | { error: Record<string, string[] | undefined> & { _form?: string[] } }

const marcaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da organização").max(200),
  nome_fantasia: z.string().trim().max(200).optional().nullable(),
})

/** Lê o id da linha singleton de `organizacao` (limit 1). */
async function getOrganizacaoId(
  supabase: Awaited<ReturnType<typeof requireRole>>["supabase"],
): Promise<string | null> {
  const { data } = await supabase.from("organizacao").select("id").limit(1).maybeSingle()
  return (data?.id as string | undefined) ?? null
}

/**
 * Salva a marca (nome, nome fantasia, logo) da Organização. Admin-only.
 * A organização é singleton: faz UPDATE da única linha por id.
 */
export async function salvarMarcaOrganizacao(formData: FormData): Promise<ActionResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(["admin"]))
  } catch {
    return { error: { _form: ["Apenas administradores podem alterar a organização."] } }
  }

  const parsed = marcaSchema.safeParse({
    nome: formData.get("nome"),
    nome_fantasia: (formData.get("nome_fantasia") as string | null)?.trim() || null,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const id = await getOrganizacaoId(supabase)
  if (!id) return { error: { _form: ["Organização não encontrada."] } }

  const logoUrl = await uploadLogo(formData, id)

  const update: Record<string, unknown> = {
    nome: parsed.data.nome,
    nome_fantasia: parsed.data.nome_fantasia,
  }
  if (logoUrl !== undefined) update.logo_url = logoUrl

  const { error } = await supabase.from("organizacao").update(update).eq("id", id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/organizacao")
  return { ok: true }
}

/**
 * Salva o template padrão de certificado da Organização. Admin-only.
 * String vazia volta a coluna para null (usa o padrão do sistema).
 */
export async function salvarTemplateCertificadoOrganizacao(
  formData: FormData,
): Promise<ActionResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(["admin"]))
  } catch {
    return { error: { _form: ["Apenas administradores podem alterar o template."] } }
  }

  const raw = (formData.get("template_certificado") as string | null)?.trim() || null
  const parsed = templateCertificadoSchema.safeParse({ template_certificado: raw })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const id = await getOrganizacaoId(supabase)
  if (!id) return { error: { _form: ["Organização não encontrada."] } }

  const { error } = await supabase
    .from("organizacao")
    .update({ template_certificado: parsed.data.template_certificado })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/organizacao")
  return { ok: true }
}

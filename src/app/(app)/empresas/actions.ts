"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { empresaSchema } from "@/lib/validations/empresa"

/**
 * Faz upload do logo no bucket `logos-empresa`.
 * Retorna a URL pública do arquivo, ou null se não houver arquivo ou falhar.
 * Se o upload falhar, loga erro e retorna null (não bloqueia o salvamento dos outros campos).
 */
async function uploadLogo(
  formData: FormData,
  empresaId: string,
): Promise<string | null | undefined> {
  const file = formData.get("logo") as File | null

  // Valor "_REMOVER_" do hidden input significa que o usuário removeu explicitamente
  if (formData.get("logo_acao") === "remover") {
    return null
  }

  if (!file || !(file instanceof File) || file.size === 0) {
    // Sem arquivo novo — mantém o atual
    return undefined
  }

  const supabase = await createClient()
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
  const path = `${empresaId}/logo-${Date.now()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabase.storage
    .from("logos-empresa")
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (upErr) {
    console.error("[uploadLogo]", upErr)
    return undefined
  }

  const { data: publicData } = supabase.storage.from("logos-empresa").getPublicUrl(path)
  return publicData.publicUrl
}

function parseForm(formData: FormData) {
  const donaSistema = formData.get("dona_sistema") === "on"
  const empresaMaeRaw = (formData.get("empresa_mae_id") as string | null)?.trim() || null
  return {
    razao_social: formData.get("razao_social") as string,
    nome_fantasia: (formData.get("nome_fantasia") as string) || null,
    cnpj: formData.get("cnpj") as string,
    inscricao_estadual: (formData.get("inscricao_estadual") as string) || null,
    tipo: formData.get("tipo") as string,
    dona_sistema: donaSistema,
    // Donas do sistema não têm mãe — força null
    empresa_mae_id: donaSistema ? null : empresaMaeRaw,
    ativo: formData.get("ativo") === "on",
  }
}

export async function createEmpresa(formData: FormData) {
  const raw = parseForm(formData)
  const parsed = empresaSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
  const supabase = await createClient()
  const { data: inserted, error } = await supabase
    .from("empresas").insert(parsed.data).select("id").single()
  if (error || !inserted) return { error: { _form: [error?.message ?? "Erro"] } }

  const logoUrl = await uploadLogo(formData, inserted.id)
  if (logoUrl !== undefined) {
    await supabase.from("empresas").update({ logo_url: logoUrl }).eq("id", inserted.id)
  }

  revalidatePath("/empresas")
  redirect("/empresas")
}

export async function updateEmpresa(id: string, formData: FormData) {
  const raw = parseForm(formData)
  const parsed = empresaSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
  const supabase = await createClient()

  const logoUrl = await uploadLogo(formData, id)
  const update: Record<string, unknown> = { ...parsed.data }
  if (logoUrl !== undefined) update.logo_url = logoUrl

  const { error } = await supabase.from("empresas").update(update).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/empresas")
  redirect("/empresas")
}

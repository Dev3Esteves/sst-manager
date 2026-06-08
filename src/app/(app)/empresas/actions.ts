"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { empresaFormSchema } from "@/lib/validations/empresa"

/**
 * Faz upload do logo no bucket `logos-empresa`.
 * Retorna a URL pública do arquivo, `null` se removido, ou `undefined` se não
 * houver arquivo novo / falhar (não bloqueia o salvamento dos demais campos).
 */
async function uploadLogo(
  formData: FormData,
  empresaId: string,
): Promise<string | null | undefined> {
  const file = formData.get("logo") as File | null

  if (formData.get("logo_acao") === "remover") {
    return null
  }
  if (!file || !(file instanceof File) || file.size === 0) {
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

/** Lê o payload (modelo BP) enviado como JSON no campo `payload`. */
function parsePayload(formData: FormData): unknown {
  const raw = formData.get("payload")
  if (typeof raw !== "string") return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function createEmpresa(formData: FormData) {
  const parsed = empresaFormSchema.safeParse(parsePayload(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
  const supabase = await createClient()

  // Empresa + filhas numa transação só (RPC atômica, RLS admin-only aplicada).
  const { data: novoId, error } = await supabase.rpc("empresa_bp_salvar", {
    p_id: null,
    p_payload: parsed.data,
  })
  if (error || !novoId) {
    return { error: { _form: [error?.message ?? "Erro ao salvar a empresa."] } }
  }

  const logoUrl = await uploadLogo(formData, novoId as string)
  if (logoUrl !== undefined) {
    await supabase.from("empresas").update({ logo_url: logoUrl }).eq("id", novoId)
  }

  revalidatePath("/empresas")
  redirect("/empresas")
}

export async function updateEmpresa(id: string, formData: FormData) {
  const parsed = empresaFormSchema.safeParse(parsePayload(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
  const supabase = await createClient()

  // Logo primeiro (fora da transação de dados; só atualiza a coluna se mudou).
  const logoUrl = await uploadLogo(formData, id)

  const { error } = await supabase.rpc("empresa_bp_salvar", {
    p_id: id,
    p_payload: parsed.data,
  })
  if (error) return { error: { _form: [error.message] } }

  if (logoUrl !== undefined) {
    await supabase.from("empresas").update({ logo_url: logoUrl }).eq("id", id)
  }

  revalidatePath("/empresas")
  redirect("/empresas")
}

export async function inativarEmpresa(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("empresas").update({ ativo: false }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/empresas")
  redirect("/empresas")
}

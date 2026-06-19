import { createClient } from "@/lib/supabase/server"

/**
 * Faz upload do logo no bucket `logos-empresa`.
 *
 * `prefixo` define a pasta do arquivo (id da empresa ou da organização).
 * Retorna a URL pública do arquivo, `null` se removido (`logo_acao=remover`),
 * ou `undefined` se não houver arquivo novo / falhar (não bloqueia o
 * salvamento dos demais campos).
 */
export async function uploadLogo(
  formData: FormData,
  prefixo: string,
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
  const path = `${prefixo}/logo-${Date.now()}.${ext}`

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

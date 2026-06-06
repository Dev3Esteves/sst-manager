"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { obraSchema, obraLocalSchema, type ObraLocalInput } from "@/lib/validations/obra"

function parseForm(formData: FormData) {
  const contratanteRaw = (formData.get("contratante_id") as string | null)?.trim()
  const ufRaw = (formData.get("uf") as string | null)?.trim()
  const empreitadaRaw = (formData.get("empreitada") as string | null)?.trim()
  const cnpjRaw = (formData.get("cnpj") as string | null)?.replace(/\D/g, "")
  const cepRaw = (formData.get("cep") as string | null)?.replace(/\D/g, "")
  return {
    empresa_id: formData.get("empresa_id") as string,
    contratante_id: contratanteRaw && contratanteRaw !== "none" ? contratanteRaw : null,
    nome: (formData.get("nome") as string) || "",
    codigo: (formData.get("codigo") as string) || null,
    cnpj: cnpjRaw || null,
    cep: cepRaw || null,
    logradouro: (formData.get("logradouro") as string) || null,
    numero: (formData.get("numero") as string) || null,
    complemento: (formData.get("complemento") as string) || null,
    bairro: (formData.get("bairro") as string) || null,
    cidade: (formData.get("cidade") as string) || null,
    uf: ufRaw && ufRaw !== "none" ? ufRaw : null,
    empreitada: empreitadaRaw && empreitadaRaw !== "none" ? empreitadaRaw : null,
    data_inicio: (formData.get("data_inicio") as string) || null,
    data_fim: (formData.get("data_fim") as string) || null,
    ativa: formData.get("ativa") === "on",
  }
}

export async function createObra(formData: FormData) {
  const parsed = obraSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { data: nova, error } = await supabase.from("obras").insert(parsed.data).select("id").single()
  if (error) return { error: { _form: [error.message] } }
  // Cria os dois locais padrão (Área Interna/Externa) — empresa_id via DEFAULT.
  if (nova?.id) {
    await supabase.from("obra_locais").insert([
      { obra_id: nova.id, nome: "Área Interna", tipo: "interna" },
      { obra_id: nova.id, nome: "Área Externa", tipo: "externa" },
    ])
  }
  revalidatePath("/obras")
  redirect("/obras")
}

export async function updateObra(id: string, formData: FormData) {
  const parsed = obraSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("obras").update(parsed.data).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/obras")
  redirect("/obras")
}

export async function inativarObra(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("obras").update({ ativa: false }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/obras")
  redirect("/obras")
}

// ---- obra_locais ----
export async function createObraLocal(payload: ObraLocalInput) {
  const parsed = obraLocalSchema.safeParse(payload)
  if (!parsed.success) return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  const supabase = await createClient()
  const { error } = await supabase.from("obra_locais").insert({
    obra_id: parsed.data.obra_id,
    nome: parsed.data.nome.trim(),
    tipo: parsed.data.tipo,
    ativo: parsed.data.ativo,
  })
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/obras/${parsed.data.obra_id}`)
  return { ok: true as const }
}

export async function toggleObraLocal(id: string, obraId: string, ativo: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from("obra_locais").update({ ativo }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/obras/${obraId}`)
  return { ok: true as const }
}

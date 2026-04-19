"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { obraSchema } from "@/lib/validations/obra"

function parseForm(formData: FormData) {
  const contratanteRaw = (formData.get("contratante_id") as string | null)?.trim()
  const ufRaw = (formData.get("uf") as string | null)?.trim()
  return {
    empresa_id: formData.get("empresa_id") as string,
    contratante_id: contratanteRaw && contratanteRaw !== "none" ? contratanteRaw : null,
    nome: (formData.get("nome") as string) || "",
    codigo: (formData.get("codigo") as string) || null,
    cidade: (formData.get("cidade") as string) || null,
    uf: ufRaw && ufRaw !== "none" ? ufRaw : null,
    data_inicio: (formData.get("data_inicio") as string) || null,
    data_fim: (formData.get("data_fim") as string) || null,
    ativa: formData.get("ativa") === "on",
  }
}

export async function createObra(formData: FormData) {
  const parsed = obraSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("obras").insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }
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

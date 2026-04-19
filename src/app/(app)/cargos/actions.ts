"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cargoSchema, episPorCargoSchema } from "@/lib/validations/cargo"

function parseForm(formData: FormData) {
  const nrs = formData.getAll("nrs_aplicaveis").map(String).filter(Boolean)
  const episRaw = (formData.get("epis_obrigatorios") as string | null) ?? ""
  let epis: unknown = null
  if (episRaw.trim()) {
    try {
      const parsed = JSON.parse(episRaw)
      // Valida estrutura — se inválida, descarta silenciosamente (mantém cargo salvável)
      const valid = episPorCargoSchema.safeParse(parsed)
      epis = valid.success ? valid.data : null
    } catch {
      epis = null
    }
  }
  return {
    empresa_id: formData.get("empresa_id") as string,
    titulo: formData.get("titulo") as string,
    cbo: (formData.get("cbo") as string) || null,
    grupo_risco: (formData.get("grupo_risco") as string) || null,
    descricao_atividades: (formData.get("descricao_atividades") as string) || null,
    nrs_aplicaveis: nrs,
    epis_obrigatorios: epis,
  }
}

export async function createCargo(formData: FormData) {
  const parsed = cargoSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("cargos").insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/cargos")
  redirect("/cargos")
}

export async function updateCargo(id: string, formData: FormData) {
  const parsed = cargoSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("cargos").update(parsed.data).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/cargos")
  redirect("/cargos")
}

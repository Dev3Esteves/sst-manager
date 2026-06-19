"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { epiSchema } from "@/lib/validations/epi"

function parseForm(formData: FormData) {
  return {
    descricao: formData.get("descricao") as string,
    ca: formData.get("ca") as string,
    ca_validade: (formData.get("ca_validade") as string) || null,
    fabricante: (formData.get("fabricante") as string) || null,
    tipo: (formData.get("tipo") as string) || null,
    unidade: (formData.get("unidade") as string) || "un",
  }
}

export async function createEpi(formData: FormData) {
  const parsed = epiSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("epis").insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/epis")
  revalidatePath("/vencimentos")
  redirect("/epis")
}

export async function updateEpi(id: string, formData: FormData) {
  const parsed = epiSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("epis").update(parsed.data).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/epis")
  revalidatePath("/vencimentos")
  redirect("/epis")
}

export async function inativarEpi(id: string) {
  const supabase = await createClient()
  // Guarda: não inativar EPI com saldo em estoque (zere/transfira antes).
  const { data: comSaldo } = await supabase
    .from("estoque_saldo").select("id").eq("epi_id", id).gt("quantidade", 0).limit(1)
  if (comSaldo && comSaldo.length > 0) {
    return { error: { _form: ["Não é possível inativar: há saldo em estoque deste EPI. Zere ou transfira o estoque antes."] } }
  }
  const { error } = await supabase.from("epis").update({ ativo: false }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/epis")
  revalidatePath("/vencimentos")
  redirect("/epis")
}

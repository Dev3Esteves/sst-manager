"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { exameSchema } from "@/lib/validations/exame"

function parseForm(formData: FormData) {
  return {
    colaborador_id: formData.get("colaborador_id") as string,
    tipo: formData.get("tipo") as string,
    subtipo: (formData.get("subtipo") as string) || null,
    data_realizacao: formData.get("data_realizacao") as string,
    data_vencimento: formData.get("data_vencimento") as string,
    resultado: (formData.get("resultado") as string) || null,
    restricoes: (formData.get("restricoes") as string) || null,
    medico_nome: (formData.get("medico_nome") as string) || null,
    crm: (formData.get("crm") as string) || null,
    clinica: (formData.get("clinica") as string) || null,
    numero_aso: (formData.get("numero_aso") as string) || null,
    observacoes: (formData.get("observacoes") as string) || null,
  }
}

export async function createExame(formData: FormData) {
  const parsed = exameSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.from("exames_medicos").insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/exames")
  revalidatePath("/vencimentos")
  redirect("/exames")
}

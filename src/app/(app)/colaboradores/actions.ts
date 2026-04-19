"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { colaboradorSchema } from "@/lib/validations/colaborador"

function parseForm(formData: FormData) {
  return {
    empresa_id: formData.get("empresa_id") as string,
    nome_completo: formData.get("nome_completo") as string,
    cpf: formData.get("cpf") as string,
    rg: (formData.get("rg") as string) || null,
    data_nascimento: (formData.get("data_nascimento") as string) || null,
    sexo: (formData.get("sexo") as string) || null,
    telefone: (formData.get("telefone") as string) || null,
    email: (formData.get("email") as string) || null,
    cargo_id: (formData.get("cargo_id") as string) || null,
    obra_id: (formData.get("obra_id") as string) || null,
    data_admissao: formData.get("data_admissao") as string,
    tipo_vinculo: formData.get("tipo_vinculo") as string,
    matricula: (formData.get("matricula") as string) || null,
    status: (formData.get("status") as string) || "ativo",
  }
}

export async function createColaborador(formData: FormData) {
  const parsed = colaboradorSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.from("colaboradores").insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/colaboradores")
  redirect("/colaboradores")
}

export async function updateColaborador(id: string, formData: FormData) {
  const parsed = colaboradorSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.from("colaboradores").update(parsed.data).eq("id", id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/colaboradores")
  redirect("/colaboradores")
}

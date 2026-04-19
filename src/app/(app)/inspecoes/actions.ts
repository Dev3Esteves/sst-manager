"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { inspecaoSchema, calcConformidade, type InspecaoInput } from "@/lib/validations/inspecao"

export async function createInspecao(payload: InspecaoInput) {
  const parsed = inspecaoSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ["Não autenticado"] } }

  const { data: link } = await supabase
    .from("usuarios").select("colaborador_id").eq("id", user.id).single()

  const percentual = calcConformidade(parsed.data.respostas)

  const { data, error } = await supabase.from("inspecoes").insert({
    template_id: parsed.data.template_id,
    empresa_id: parsed.data.empresa_id,
    inspetor_id: parsed.data.inspetor_id ?? link?.colaborador_id ?? null,
    local: parsed.data.local,
    data_inspecao: parsed.data.data_inspecao,
    respostas: parsed.data.respostas,
    percentual_conformidade: percentual,
    observacoes_gerais: parsed.data.observacoes_gerais,
    status: "concluida",
  }).select("id").single()

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/inspecoes")
  redirect(`/inspecoes/${data.id}`)
}

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { treinamentoSchema, treinamentoRealizadoSchema } from "@/lib/validations/treinamento"

function parseTreinamento(formData: FormData) {
  const conteudoRaw = (formData.get("conteudo_programatico_raw") as string) || ""
  const conteudo_programatico = conteudoRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  return {
    titulo: formData.get("titulo") as string,
    nr_referencia: (formData.get("nr_referencia") as string) || null,
    carga_horaria_horas: formData.get("carga_horaria_horas") as string,
    validade_meses: (formData.get("validade_meses") as string) || null,
    tipo: formData.get("tipo") as string,
    modalidade: formData.get("modalidade") as string,
    texto_certificado: (formData.get("texto_certificado") as string) || null,
    cidade_emissao: (formData.get("cidade_emissao") as string) || null,
    conteudo_programatico,
  }
}

export async function createTreinamento(formData: FormData) {
  const parsed = treinamentoSchema.safeParse(parseTreinamento(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("treinamentos").insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/treinamentos")
  redirect("/treinamentos")
}

export async function updateTreinamento(id: string, formData: FormData) {
  const parsed = treinamentoSchema.safeParse(parseTreinamento(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("treinamentos").update(parsed.data).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/treinamentos")
  redirect("/treinamentos")
}

export async function inativarTreinamento(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("treinamentos").update({ ativo: false }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/treinamentos")
  redirect("/treinamentos")
}

export async function cancelarRealizacao(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("treinamentos_realizados").update({ status: "cancelado" }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/treinamentos/realizacoes")
  revalidatePath("/vencimentos")
  redirect("/treinamentos/realizacoes")
}

export async function createRealizacao(formData: FormData) {
  const parsed = treinamentoRealizadoSchema.safeParse({
    colaborador_id: formData.get("colaborador_id"),
    treinamento_id: formData.get("treinamento_id"),
    data_realizacao: formData.get("data_realizacao"),
    instrutor: (formData.get("instrutor") as string) || null,
    entidade: (formData.get("entidade") as string) || null,
    local: (formData.get("local") as string) || null,
    nota_avaliacao: (formData.get("nota_avaliacao") as string) || null,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { error } = await supabase.from("treinamentos_realizados").insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/treinamentos/realizacoes")
  revalidatePath("/vencimentos")
  redirect("/treinamentos/realizacoes")
}

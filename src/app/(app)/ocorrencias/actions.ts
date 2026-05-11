"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ocorrenciaSchema, investigacaoSchema, type OcorrenciaInput, type InvestigacaoInput } from "@/lib/validations/ocorrencia"

export async function createOcorrencia(payload: OcorrenciaInput) {
  const parsed = ocorrenciaSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()
  const { data, error } = await supabase.from("ocorrencias").insert({
    empresa_id: parsed.data.empresa_id,
    tipo: parsed.data.tipo,
    data_ocorrencia: parsed.data.data_ocorrencia,
    local: parsed.data.local,
    descricao: parsed.data.descricao,
    colaborador_id: parsed.data.colaborador_id,
    gravidade: parsed.data.gravidade,
    parte_corpo_atingida: parsed.data.parte_corpo_atingida,
    natureza_lesao: parsed.data.natureza_lesao,
    agente_causador: parsed.data.agente_causador,
    dias_afastamento: parsed.data.dias_afastamento,
    status: "aberta",
  }).select("id").single()

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/ocorrencias")
  redirect(`/ocorrencias/${data.id}`)
}

export async function updateOcorrencia(id: string, payload: OcorrenciaInput) {
  const parsed = ocorrenciaSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("ocorrencias").update({
    empresa_id: parsed.data.empresa_id,
    tipo: parsed.data.tipo,
    data_ocorrencia: parsed.data.data_ocorrencia,
    local: parsed.data.local,
    descricao: parsed.data.descricao,
    colaborador_id: parsed.data.colaborador_id,
    gravidade: parsed.data.gravidade,
    parte_corpo_atingida: parsed.data.parte_corpo_atingida,
    natureza_lesao: parsed.data.natureza_lesao,
    agente_causador: parsed.data.agente_causador,
    dias_afastamento: parsed.data.dias_afastamento,
  }).eq("id", id)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/ocorrencias/${id}`)
  revalidatePath("/ocorrencias")
  redirect(`/ocorrencias/${id}`)
}

export async function saveInvestigacao(ocorrenciaId: string, payload: InvestigacaoInput) {
  const parsed = investigacaoSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("ocorrencias").update({
    investigacao: parsed.data,
    causa_raiz: parsed.data.causa_raiz,
    acoes_corretivas: parsed.data.acoes_corretivas,
    status: "investigando",
  }).eq("id", ocorrenciaId)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/ocorrencias/${ocorrenciaId}`)
  return { ok: true }
}

export async function concluirOcorrencia(ocorrenciaId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("ocorrencias")
    .update({ status: "concluida" })
    .eq("id", ocorrenciaId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/ocorrencias/${ocorrenciaId}`)
  return { ok: true }
}

export async function encerrarOcorrencia(ocorrenciaId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("ocorrencias")
    .update({ status: "encerrada" })
    .eq("id", ocorrenciaId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/ocorrencias/${ocorrenciaId}`)
  revalidatePath("/ocorrencias")
  redirect("/ocorrencias")
}

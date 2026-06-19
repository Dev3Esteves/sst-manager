"use server"

import { revalidatePath } from "next/cache"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { epiEntregaSchema, type EpiEntregaInput } from "@/lib/validations/epi-entrega"

export async function createEntrega(payload: EpiEntregaInput) {
  const parsed = epiEntregaSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()

  let assinaturaUrl: string | null = null
  if (parsed.data.assinatura_data_url?.startsWith("data:image")) {
    const base64 = parsed.data.assinatura_data_url.split(",")[1]
    const buffer = Buffer.from(base64, "base64")
    const fileName = `epi-${parsed.data.colaborador_id}/${Date.now()}.png`
    const { error: upErr } = await supabase.storage
      .from("assinaturas")
      .upload(fileName, buffer, { contentType: "image/png", upsert: false })
    if (!upErr) assinaturaUrl = fileName
  }

  // Insere a entrega E dá baixa no estoque (saída) na MESMA transação (RPC).
  // Resolve o local pelo obra do colaborador (fallback: almoxarifado central).
  // Saldo insuficiente / sem local configurado → erro, sem criar a entrega.
  const { error } = await supabase.rpc("entrega_com_saida", {
    p_payload: {
      colaborador_id: parsed.data.colaborador_id,
      epi_id: parsed.data.epi_id,
      data_entrega: parsed.data.data_entrega,
      quantidade: parsed.data.quantidade,
      motivo: parsed.data.motivo,
      observacoes: parsed.data.observacoes,
      assinatura_url: assinaturaUrl,
      ciencia: parsed.data.ciencia ?? false,
    },
  })
  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/epis/entregas")
  redirect("/epis/entregas")
}

/** Marca um EPI entregue como devolvido (controle de devolução — NR-6). */
export async function devolverEpi(id: string, dataDevolucao: string) {
  const supabase = await createClient()
  // Idempotência: não credita o estoque duas vezes.
  const { data: ent } = await supabase.from("epi_entregas").select("devolvido").eq("id", id).single()
  if (ent?.devolvido) return { ok: true as const }
  // Devolução = entrada de retorno no local (obra do colaborador / central).
  const { error: movErr } = await supabase.rpc("estoque_devolucao", { p_entrega_id: id, p_obs: null })
  if (movErr) return { error: { _form: [movErr.message] } }
  const { error } = await supabase
    .from("epi_entregas")
    .update({ devolvido: true, data_devolucao: dataDevolucao || hojeBrasilia() })
    .eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/epis/entregas")
  revalidatePath(`/epis/entregas/${id}`)
  return { ok: true as const }
}

export async function updateEntrega(id: string, payload: EpiEntregaInput) {
  const parsed = epiEntregaSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()
  // Após a baixa de estoque, colaborador/EPI/quantidade são imutáveis (evita
  // dessincronizar o saldo). Só metadados editáveis.
  const { error } = await supabase.from("epi_entregas").update({
    data_entrega: parsed.data.data_entrega,
    motivo: parsed.data.motivo,
    observacoes: parsed.data.observacoes,
  }).eq("id", id)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/epis/entregas")
  redirect("/epis/entregas")
}

export async function inativarEntrega(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("epi_entregas").update({ ativo: false }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/epis/entregas")
  redirect("/epis/entregas")
}

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ddsSchema, type DdsInput } from "@/lib/validations/dds"

async function uploadAssinatura(
  dataUrl: string | null | undefined,
  path: string,
): Promise<string | null> {
  if (!dataUrl?.startsWith("data:image")) return null
  const supabase = await createClient()
  const base64 = dataUrl.split(",")[1]
  const buffer = Buffer.from(base64, "base64")
  const { error } = await supabase.storage
    .from("assinaturas")
    .upload(path, buffer, { contentType: "image/png", upsert: false })
  if (error) {
    console.error("[uploadAssinatura]", error)
    return null
  }
  const { data: publicData } = supabase.storage.from("assinaturas").getPublicUrl(path)
  return publicData.publicUrl
}

export async function createDDS(payload: DdsInput) {
  const parsed = ddsSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.errors[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Não autenticado" }

  const { data: link } = await supabase
    .from("usuarios").select("colaborador_id").eq("id", user.id).single()

  const ddsId = crypto.randomUUID()
  const timestamp = Date.now()

  // Upload de assinaturas — uma por participante + a do mediador
  const participantesProcessados = await Promise.all(
    parsed.data.participantes.map(async (p, i) => {
      const path = `dds/${ddsId}/participante-${i}-${timestamp}.png`
      const url = await uploadAssinatura(p.assinatura_data_url, path)
      return {
        colaborador_id: p.colaborador_id ?? null,
        nome: p.nome,
        cpf: p.cpf ?? null,
        cargo: p.cargo ?? null,
        assinatura_url: url,
      }
    })
  )

  const mediadorPath = `dds/${ddsId}/mediador-${timestamp}.png`
  const mediadorUrl = await uploadAssinatura(parsed.data.assinatura_mediador_data_url, mediadorPath)

  const conteudo = {
    tema: parsed.data.tema,
    data_dds: parsed.data.data_dds,
    hora_inicio: parsed.data.hora_inicio ?? null,
    duracao_minutos: parsed.data.duracao_minutos,
    local: parsed.data.local,
    mediador_nome: parsed.data.mediador_nome,
    mediador_cargo: parsed.data.mediador_cargo ?? null,
    topicos: parsed.data.topicos,
    observacoes: parsed.data.observacoes ?? null,
    participantes: participantesProcessados,
    assinatura_mediador_url: mediadorUrl,
  }

  const { data: doc, error } = await supabase.from("documentos_sst").insert({
    tipo: "dialogo_seguranca",
    titulo: `DDS — ${parsed.data.tema}`,
    empresa_id: parsed.data.empresa_id,
    local_trabalho: parsed.data.local,
    data_emissao: parsed.data.data_dds,
    status: "emitido",
    elaborado_por: link?.colaborador_id ?? null,
    conteudo,
  }).select("id").single()

  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/dds")
  revalidatePath("/documentos")
  redirect(`/dds/${doc.id}`)
}

export async function cancelarDds(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("documentos_sst").update({ status: "cancelado" }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/dds")
  revalidatePath("/documentos")
  redirect("/dds")
}

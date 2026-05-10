"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { riscoSchema } from "@/lib/validations/pgr"

function parseForm(formData: FormData, pgrGheId: string) {
  const ordemRaw = (formData.get("ordem") as string | null)?.trim() || "0"
  const opt = (k: string) => {
    const v = (formData.get(k) as string | null)?.trim()
    return v && v !== "" ? v : null
  }
  return {
    pgr_ghe_id: pgrGheId,
    categoria: (formData.get("categoria") as string) || "acidente",
    agente_ambiental: ((formData.get("agente_ambiental") as string) || "").trim(),
    codigo_esocial: opt("codigo_esocial"),
    fontes_geradoras: opt("fontes_geradoras"),
    trajetoria: opt("trajetoria"),
    via_ingresso: opt("via_ingresso"),
    possiveis_danos: opt("possiveis_danos"),
    tipo_exposicao: opt("tipo_exposicao") as
      | "eventual" | "moderado" | "habitual" | null,
    categoria_risco: opt("categoria_risco") as
      | "muito_baixo" | "baixo" | "medio" | "alto" | "muito_alto" | null,
    observacoes: opt("observacoes"),
    ordem: Number(ordemRaw),
  }
}

async function resolveContextFromGhe(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gheId: string,
) {
  const { data } = await supabase
    .from("pgr_ghe")
    .select("empresa_id, pgr_id")
    .eq("id", gheId)
    .single()
  return data as { empresa_id: string; pgr_id: string } | null
}

export async function createRisco(gheId: string, formData: FormData) {
  const parsed = riscoSchema.safeParse(parseForm(formData, gheId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const ctx = await resolveContextFromGhe(supabase, gheId)
  if (!ctx) return { error: { _form: ["GHE inválido"] } }

  const { error } = await supabase.from("pgr_risco").insert({
    ...parsed.data,
    empresa_id: ctx.empresa_id,
    pgr_id: ctx.pgr_id,
  })

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${ctx.pgr_id}`)
  revalidatePath(`/pgr/${ctx.pgr_id}/ghe/${gheId}`)
  redirect(`/pgr/${ctx.pgr_id}/ghe/${gheId}`)
}

export async function updateRisco(riscoId: string, gheId: string, formData: FormData) {
  const parsed = riscoSchema.safeParse(parseForm(formData, gheId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const ctx = await resolveContextFromGhe(supabase, gheId)
  if (!ctx) return { error: { _form: ["GHE inválido"] } }

  const { error } = await supabase
    .from("pgr_risco")
    .update({ ...parsed.data, empresa_id: ctx.empresa_id, pgr_id: ctx.pgr_id })
    .eq("id", riscoId)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${ctx.pgr_id}`)
  revalidatePath(`/pgr/${ctx.pgr_id}/ghe/${gheId}`)
  redirect(`/pgr/${ctx.pgr_id}/ghe/${gheId}`)
}

export async function deleteRisco(riscoId: string, gheId: string, pgrId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("pgr_risco").delete().eq("id", riscoId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${pgrId}`)
  revalidatePath(`/pgr/${pgrId}/ghe/${gheId}`)
  redirect(`/pgr/${pgrId}/ghe/${gheId}`)
}

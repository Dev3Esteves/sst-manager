"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { epiGheSchema } from "@/lib/validations/pgr"

function parseForm(formData: FormData, pgrGheId: string) {
  const opt = (k: string) => {
    const v = (formData.get(k) as string | null)?.trim()
    return v && v !== "" ? v : null
  }
  const epiIdRaw = (formData.get("epi_id") as string | null)?.trim()
  const ordemRaw = (formData.get("ordem") as string | null)?.trim() || "0"
  return {
    pgr_ghe_id: pgrGheId,
    epi_nome: ((formData.get("epi_nome") as string) || "").trim(),
    epi_id: epiIdRaw && epiIdRaw !== "none" ? epiIdRaw : null,
    uso: (formData.get("uso") as string) || "permanente",
    observacao: opt("observacao"),
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

export async function createEpiGhe(gheId: string, formData: FormData) {
  const parsed = epiGheSchema.safeParse(parseForm(formData, gheId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const ctx = await resolveContextFromGhe(supabase, gheId)
  if (!ctx) return { error: { _form: ["GHE inválido"] } }

  const { error } = await supabase.from("pgr_epi_ghe").insert({
    ...parsed.data,
    empresa_id: ctx.empresa_id,
    pgr_id: ctx.pgr_id,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: { epi_nome: ["Este EPI já está vinculado a este GHE"] } }
    }
    return { error: { _form: [error.message] } }
  }
  revalidatePath(`/pgr/${ctx.pgr_id}`)
  revalidatePath(`/pgr/${ctx.pgr_id}/ghe/${gheId}`)
  redirect(`/pgr/${ctx.pgr_id}/ghe/${gheId}`)
}

export async function updateEpiGhe(epiGheId: string, gheId: string, formData: FormData) {
  const parsed = epiGheSchema.safeParse(parseForm(formData, gheId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const ctx = await resolveContextFromGhe(supabase, gheId)
  if (!ctx) return { error: { _form: ["GHE inválido"] } }

  const { error } = await supabase
    .from("pgr_epi_ghe")
    .update({ ...parsed.data, empresa_id: ctx.empresa_id, pgr_id: ctx.pgr_id })
    .eq("id", epiGheId)

  if (error) {
    if (error.code === "23505") {
      return { error: { epi_nome: ["Este EPI já está vinculado a este GHE"] } }
    }
    return { error: { _form: [error.message] } }
  }
  revalidatePath(`/pgr/${ctx.pgr_id}`)
  revalidatePath(`/pgr/${ctx.pgr_id}/ghe/${gheId}`)
  redirect(`/pgr/${ctx.pgr_id}/ghe/${gheId}`)
}

export async function deleteEpiGhe(epiGheId: string, gheId: string, pgrId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("pgr_epi_ghe").delete().eq("id", epiGheId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${pgrId}`)
  revalidatePath(`/pgr/${pgrId}/ghe/${gheId}`)
  redirect(`/pgr/${pgrId}/ghe/${gheId}`)
}

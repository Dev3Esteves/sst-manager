"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { medidaSchema } from "@/lib/validations/pgr"

function parseForm(formData: FormData, pgrId: string) {
  const opt = (k: string) => {
    const v = (formData.get(k) as string | null)?.trim()
    return v && v !== "" ? v : null
  }
  const gheRaw = (formData.get("pgr_ghe_id") as string | null)?.trim()
  const ghe = gheRaw && gheRaw !== "none" ? gheRaw : null
  const niveRaw = (formData.get("nivel_niosh") as string | null)?.trim()
  const ordemRaw = (formData.get("ordem") as string | null)?.trim() || "0"
  return {
    pgr_id: pgrId,
    pgr_ghe_id: ghe,
    agente_ambiental: opt("agente_ambiental"),
    tipo_medida: (formData.get("tipo_medida") as string) || "coletiva",
    nivel_niosh: niveRaw && niveRaw !== "none" ? Number(niveRaw) : null,
    acao: ((formData.get("acao") as string) || "").trim(),
    detalhamento: opt("detalhamento"),
    abrangencia: opt("abrangencia"),
    periodicidade: opt("periodicidade"),
    status: (formData.get("status") as string) || "planejado",
    ordem: Number(ordemRaw),
  }
}

async function resolveEmpresaId(supabase: Awaited<ReturnType<typeof createClient>>, pgrId: string) {
  const { data } = await supabase.from("pgr").select("empresa_id").eq("id", pgrId).single()
  return data?.empresa_id as string | undefined
}

export async function createMedida(pgrId: string, formData: FormData) {
  const parsed = medidaSchema.safeParse(parseForm(formData, pgrId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const empresaId = await resolveEmpresaId(supabase, pgrId)
  if (!empresaId) return { error: { _form: ["PGR inválido"] } }

  const { error } = await supabase
    .from("pgr_medida_controle")
    .insert({ ...parsed.data, empresa_id: empresaId })

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${pgrId}`)
  redirect(`/pgr/${pgrId}`)
}

export async function updateMedida(medidaId: string, pgrId: string, formData: FormData) {
  const parsed = medidaSchema.safeParse(parseForm(formData, pgrId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const empresaId = await resolveEmpresaId(supabase, pgrId)
  if (!empresaId) return { error: { _form: ["PGR inválido"] } }

  const { error } = await supabase
    .from("pgr_medida_controle")
    .update({ ...parsed.data, empresa_id: empresaId })
    .eq("id", medidaId)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${pgrId}`)
  redirect(`/pgr/${pgrId}`)
}

export async function deleteMedida(medidaId: string, pgrId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("pgr_medida_controle").delete().eq("id", medidaId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${pgrId}`)
  redirect(`/pgr/${pgrId}`)
}

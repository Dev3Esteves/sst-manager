"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { gheSchema } from "@/lib/validations/pgr"

function parseForm(formData: FormData) {
  const numExpRaw = (formData.get("num_empregados_expostos") as string | null)?.trim()
  const ordemRaw = (formData.get("ordem") as string | null)?.trim() || "0"
  return {
    pgr_id: formData.get("pgr_id") as string,
    codigo: ((formData.get("codigo") as string) || "").trim(),
    descricao: ((formData.get("descricao") as string) || "").trim(),
    funcao_posicao: (formData.get("funcao_posicao") as string) || null,
    area_identificacao: (formData.get("area_identificacao") as string) || null,
    caracterizacao_atividades: (formData.get("caracterizacao_atividades") as string) || null,
    local_trabalho: (formData.get("local_trabalho") as string) || null,
    num_empregados_expostos: numExpRaw ? Number(numExpRaw) : null,
    ordem: Number(ordemRaw),
  }
}

async function resolveEmpresaId(supabase: Awaited<ReturnType<typeof createClient>>, pgrId: string) {
  const { data } = await supabase.from("pgr").select("empresa_id").eq("id", pgrId).single()
  return data?.empresa_id as string | undefined
}

export async function createGhe(formData: FormData) {
  const parsed = gheSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const empresaId = await resolveEmpresaId(supabase, parsed.data.pgr_id)
  if (!empresaId) return { error: { _form: ["PGR inválido — empresa não encontrada"] } }

  const { error } = await supabase
    .from("pgr_ghe")
    .insert({ ...parsed.data, empresa_id: empresaId })

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${parsed.data.pgr_id}`)
  redirect(`/pgr/${parsed.data.pgr_id}`)
}

export async function updateGhe(gheId: string, formData: FormData) {
  const parsed = gheSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const empresaId = await resolveEmpresaId(supabase, parsed.data.pgr_id)
  if (!empresaId) return { error: { _form: ["PGR inválido"] } }

  const { error } = await supabase
    .from("pgr_ghe")
    .update({ ...parsed.data, empresa_id: empresaId })
    .eq("id", gheId)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${parsed.data.pgr_id}`)
  revalidatePath(`/pgr/${parsed.data.pgr_id}/ghe/${gheId}`)
  redirect(`/pgr/${parsed.data.pgr_id}`)
}

export async function deleteGhe(gheId: string, pgrId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("pgr_ghe").delete().eq("id", gheId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${pgrId}`)
  redirect(`/pgr/${pgrId}`)
}

// ---------------------------------------------------------------------------
// pgr_ghe_cargo — actions para o sub-editor de cargos por GHE
// ---------------------------------------------------------------------------

async function resolveEmpresaIdFromGhe(
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

export async function addCargoToGhe(gheId: string, formData: FormData) {
  const cargoTitulo = ((formData.get("cargo_titulo") as string) || "").trim()
  if (cargoTitulo.length < 2) {
    return { error: { cargo_titulo: ["Mínimo 2 caracteres"] } }
  }
  const cargoIdRaw = (formData.get("cargo_id") as string | null)?.trim()
  const cargoId = cargoIdRaw && cargoIdRaw !== "none" ? cargoIdRaw : null

  const supabase = await createClient()
  const ghe = await resolveEmpresaIdFromGhe(supabase, gheId)
  if (!ghe) return { error: { _form: ["GHE inválido"] } }

  const { error } = await supabase.from("pgr_ghe_cargo").insert({
    empresa_id: ghe.empresa_id,
    pgr_ghe_id: gheId,
    cargo_titulo: cargoTitulo,
    cargo_id: cargoId,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: { cargo_titulo: ["Este cargo já está no GHE"] } }
    }
    return { error: { _form: [error.message] } }
  }
  revalidatePath(`/pgr/${ghe.pgr_id}/ghe/${gheId}`)
}

export async function removeCargoFromGhe(cargoRowId: string, gheId: string, pgrId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("pgr_ghe_cargo").delete().eq("id", cargoRowId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${pgrId}/ghe/${gheId}`)
}

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

/**
 * Auto-preenche o GHE a partir da equipe da obra do PGR: adiciona os cargos da
 * `obra_equipe` como cargos do GHE (ignorando os já presentes) e ajusta o nº de
 * expostos para o total alocado na obra. Não remove nada (não destrutivo).
 */
export async function importarEquipeDaObra(gheId: string, pgrId: string) {
  const supabase = await createClient()
  const ghe = await resolveEmpresaIdFromGhe(supabase, gheId)
  if (!ghe) return { error: { _form: ["GHE inválido"] } }

  const { data: pgr } = await supabase.from("pgr").select("obra_id").eq("id", pgrId).single()
  if (!pgr?.obra_id) return { error: { _form: ["PGR sem obra vinculada"] } }

  const { data: equipe } = await supabase
    .from("obra_equipe")
    .select("cargo_titulo, cargo_id, quantidade")
    .eq("obra_id", pgr.obra_id)
  if (!equipe || equipe.length === 0) {
    return { error: { _form: ["A obra não tem equipe (funções) cadastrada"] } }
  }

  const { data: existentes } = await supabase
    .from("pgr_ghe_cargo")
    .select("cargo_titulo")
    .eq("pgr_ghe_id", gheId)
  const jaTem = new Set((existentes ?? []).map((c) => c.cargo_titulo.trim().toLowerCase()))

  const novos = equipe
    .filter((e) => !jaTem.has(e.cargo_titulo.trim().toLowerCase()))
    .map((e) => ({
      empresa_id: ghe.empresa_id,
      pgr_ghe_id: gheId,
      cargo_titulo: e.cargo_titulo,
      cargo_id: e.cargo_id ?? null,
    }))
  if (novos.length > 0) {
    const { error } = await supabase.from("pgr_ghe_cargo").insert(novos)
    if (error) return { error: { _form: [error.message] } }
  }

  const totalExpostos = equipe.reduce((s, e) => s + (e.quantidade ?? 0), 0)
  await supabase.from("pgr_ghe").update({ num_empregados_expostos: totalExpostos }).eq("id", gheId)

  revalidatePath(`/pgr/${pgrId}/ghe/${gheId}`)
  return { ok: true as const, adicionados: novos.length, totalExpostos }
}

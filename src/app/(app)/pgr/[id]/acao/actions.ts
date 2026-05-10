"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { acaoSchema } from "@/lib/validations/pgr"

function parseForm(formData: FormData, pgrId: string) {
  const opt = (k: string) => {
    const v = (formData.get(k) as string | null)?.trim()
    return v && v !== "" ? v : null
  }
  return {
    pgr_id: pgrId,
    numero_item: Number((formData.get("numero_item") as string) || "0"),
    o_que: ((formData.get("o_que") as string) || "").trim(),
    quem: opt("quem"),
    onde: opt("onde"),
    quando: opt("quando"),
    por_que: opt("por_que"),
    como: opt("como"),
    status: (formData.get("status") as string) || "planejado",
    observacoes: opt("observacoes"),
  }
}

async function resolveEmpresaId(supabase: Awaited<ReturnType<typeof createClient>>, pgrId: string) {
  const { data } = await supabase.from("pgr").select("empresa_id").eq("id", pgrId).single()
  return data?.empresa_id as string | undefined
}

export async function createAcao(pgrId: string, formData: FormData) {
  const parsed = acaoSchema.safeParse(parseForm(formData, pgrId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const empresaId = await resolveEmpresaId(supabase, pgrId)
  if (!empresaId) return { error: { _form: ["PGR inválido"] } }

  const { error } = await supabase
    .from("pgr_acao")
    .insert({ ...parsed.data, empresa_id: empresaId })

  if (error) {
    if (error.code === "23505") {
      return { error: { numero_item: ["Já existe ação com este número neste PGR"] } }
    }
    return { error: { _form: [error.message] } }
  }
  revalidatePath(`/pgr/${pgrId}`)
  redirect(`/pgr/${pgrId}`)
}

export async function updateAcao(acaoId: string, pgrId: string, formData: FormData) {
  const parsed = acaoSchema.safeParse(parseForm(formData, pgrId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const empresaId = await resolveEmpresaId(supabase, pgrId)
  if (!empresaId) return { error: { _form: ["PGR inválido"] } }

  const { error } = await supabase
    .from("pgr_acao")
    .update({ ...parsed.data, empresa_id: empresaId })
    .eq("id", acaoId)

  if (error) {
    if (error.code === "23505") {
      return { error: { numero_item: ["Já existe ação com este número neste PGR"] } }
    }
    return { error: { _form: [error.message] } }
  }
  revalidatePath(`/pgr/${pgrId}`)
  redirect(`/pgr/${pgrId}`)
}

export async function deleteAcao(acaoId: string, pgrId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("pgr_acao").delete().eq("id", acaoId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/pgr/${pgrId}`)
  redirect(`/pgr/${pgrId}`)
}

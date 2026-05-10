"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { pgrSchema } from "@/lib/validations/pgr"

function parseForm(formData: FormData) {
  const numRevRaw = (formData.get("numero_revisao") as string | null)?.trim() || "0"
  const numEmpRaw = (formData.get("num_empregados_snapshot") as string | null)?.trim()
  return {
    obra_id: formData.get("obra_id") as string,
    numero_revisao: Number(numRevRaw),
    descricao_revisao: (formData.get("descricao_revisao") as string) || null,
    data_emissao: (formData.get("data_emissao") as string) || "",
    data_vencimento: (formData.get("data_vencimento") as string) || "",
    status: (formData.get("status") as string) || "rascunho",

    responsavel_elaboracao_nome: (formData.get("responsavel_elaboracao_nome") as string) || null,
    responsavel_elaboracao_funcao: (formData.get("responsavel_elaboracao_funcao") as string) || null,
    responsavel_elaboracao_crea: (formData.get("responsavel_elaboracao_crea") as string) || null,
    responsavel_obra_nome: (formData.get("responsavel_obra_nome") as string) || null,
    responsavel_obra_funcao: (formData.get("responsavel_obra_funcao") as string) || null,
    responsavel_obra_crea: (formData.get("responsavel_obra_crea") as string) || null,

    cno_obra_snapshot: (formData.get("cno_obra_snapshot") as string) || null,
    num_empregados_snapshot: numEmpRaw ? Number(numEmpRaw) : null,
    data_inicio_obra_snapshot: (formData.get("data_inicio_obra_snapshot") as string) || null,

    codigo_formulario: (formData.get("codigo_formulario") as string) || "FO-121-00",
  }
}

async function resolveEmpresaId(supabase: Awaited<ReturnType<typeof createClient>>, obraId: string) {
  const { data } = await supabase.from("obras").select("empresa_id").eq("id", obraId).single()
  return data?.empresa_id as string | undefined
}

export async function createPgr(formData: FormData) {
  const parsed = pgrSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const empresaId = await resolveEmpresaId(supabase, parsed.data.obra_id)
  if (!empresaId) return { error: { _form: ["Obra inválida — empresa não encontrada"] } }

  const { data: inserted, error } = await supabase
    .from("pgr")
    .insert({ ...parsed.data, empresa_id: empresaId })
    .select("id")
    .single()

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/pgr")
  redirect(`/pgr/${inserted.id}`)
}

export async function updatePgr(id: string, formData: FormData) {
  const parsed = pgrSchema.safeParse(parseForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const empresaId = await resolveEmpresaId(supabase, parsed.data.obra_id)
  if (!empresaId) return { error: { _form: ["Obra inválida"] } }

  const { error } = await supabase
    .from("pgr")
    .update({ ...parsed.data, empresa_id: empresaId })
    .eq("id", id)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/pgr")
  revalidatePath(`/pgr/${id}`)
  redirect(`/pgr/${id}`)
}

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  naoConformidadeSchema,
  ncAcaoCorretivaSchema,
  ncCausa5whysSchema,
  ncCausaIshikawaSchema,
  type IshikawaCategoria,
} from "@/lib/validations/nao-conformidade"

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function opt(formData: FormData, key: string) {
  const v = (formData.get(key) as string | null)?.trim()
  return v && v !== "" && v !== "none" ? v : null
}

function parseNcForm(formData: FormData) {
  return {
    empresa_id: ((formData.get("empresa_id") as string) || "").trim(),
    obra_id: opt(formData, "obra_id"),
    ocorrencia_id: opt(formData, "ocorrencia_id"),
    titulo: ((formData.get("titulo") as string) || "").trim(),
    descricao: ((formData.get("descricao") as string) || "").trim(),
    origem: (formData.get("origem") as string) || "outro",
    data_identificacao:
      (formData.get("data_identificacao") as string) ||
      new Date().toISOString().slice(0, 10),
    identificado_por_nome: opt(formData, "identificado_por_nome"),
    identificado_por_id: opt(formData, "identificado_por_id"),
    severidade: (formData.get("severidade") as string) || "media",
    status: (formData.get("status") as string) || "aberta",
    data_encerramento: opt(formData, "data_encerramento"),
    metodo_analise: opt(formData, "metodo_analise"),
    causa_raiz_consolidada: opt(formData, "causa_raiz_consolidada"),
    observacoes: opt(formData, "observacoes"),
  }
}

// -----------------------------------------------------------------------------
// NC CRUD
// -----------------------------------------------------------------------------

export async function createNc(formData: FormData) {
  const parsed = naoConformidadeSchema.safeParse(parseNcForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("nao_conformidades")
    .insert(parsed.data)
    .select("id")
    .single()

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/nao-conformidades")
  redirect(`/nao-conformidades/${data.id}`)
}

export async function updateNc(ncId: string, formData: FormData) {
  const parsed = naoConformidadeSchema.safeParse(parseNcForm(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase
    .from("nao_conformidades")
    .update(parsed.data)
    .eq("id", ncId)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/nao-conformidades/${ncId}`)
  revalidatePath("/nao-conformidades")
  return { ok: true }
}

export async function deleteNc(ncId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("nao_conformidades").delete().eq("id", ncId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/nao-conformidades")
  redirect("/nao-conformidades")
}

export async function cancelarNc(ncId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("nao_conformidades").update({ status: "cancelada" }).eq("id", ncId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/nao-conformidades/${ncId}`)
  revalidatePath("/nao-conformidades")
  redirect("/nao-conformidades")
}

// -----------------------------------------------------------------------------
// 5 Whys (replace-all por NC)
// -----------------------------------------------------------------------------

export type Cinco5WhysItem = {
  ordem: number
  pergunta: string
  resposta: string
  eh_causa_raiz: boolean
}

export async function replace5whys(ncId: string, itens: Cinco5WhysItem[]) {
  const supabase = await createClient()

  // Resolve empresa_id da NC
  const { data: nc } = await supabase
    .from("nao_conformidades")
    .select("empresa_id")
    .eq("id", ncId)
    .single<{ empresa_id: string }>()
  if (!nc) return { error: { _form: ["NC não encontrada"] } }

  // Valida cada item antes de fazer qualquer mudança
  const rows = itens
    .filter((i) => i.pergunta.trim() !== "" || i.resposta.trim() !== "")
    .map((i) => ({
      nao_conformidade_id: ncId,
      ordem: i.ordem,
      pergunta: i.pergunta.trim(),
      resposta: i.resposta.trim(),
      eh_causa_raiz: i.eh_causa_raiz,
    }))

  for (const r of rows) {
    const parsed = ncCausa5whysSchema.safeParse(r)
    if (!parsed.success) {
      return {
        error: {
          _form: [`Item #${r.ordem}: ${parsed.error.errors[0]?.message ?? "inválido"}`],
        },
      }
    }
  }

  const { error: delErr } = await supabase
    .from("nc_causa_5whys")
    .delete()
    .eq("nao_conformidade_id", ncId)
  if (delErr) return { error: { _form: [delErr.message] } }

  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from("nc_causa_5whys")
      .insert(rows.map((r) => ({ ...r, empresa_id: nc.empresa_id })))
    if (insErr) return { error: { _form: [insErr.message] } }
  }

  revalidatePath(`/nao-conformidades/${ncId}`)
  return { ok: true }
}

// -----------------------------------------------------------------------------
// Ishikawa (replace-all por NC)
// -----------------------------------------------------------------------------

export type IshikawaItem = {
  categoria: IshikawaCategoria
  causa: string
  eh_causa_raiz: boolean
  ordem: number
}

export async function replaceIshikawa(ncId: string, itens: IshikawaItem[]) {
  const supabase = await createClient()

  const { data: nc } = await supabase
    .from("nao_conformidades")
    .select("empresa_id")
    .eq("id", ncId)
    .single<{ empresa_id: string }>()
  if (!nc) return { error: { _form: ["NC não encontrada"] } }

  const rows = itens
    .filter((i) => i.causa.trim() !== "")
    .map((i) => ({
      nao_conformidade_id: ncId,
      categoria: i.categoria,
      causa: i.causa.trim(),
      eh_causa_raiz: i.eh_causa_raiz,
      ordem: i.ordem,
    }))

  for (const r of rows) {
    const parsed = ncCausaIshikawaSchema.safeParse(r)
    if (!parsed.success) {
      return {
        error: {
          _form: [`Ishikawa: ${parsed.error.errors[0]?.message ?? "inválido"}`],
        },
      }
    }
  }

  const { error: delErr } = await supabase
    .from("nc_causa_ishikawa")
    .delete()
    .eq("nao_conformidade_id", ncId)
  if (delErr) return { error: { _form: [delErr.message] } }

  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from("nc_causa_ishikawa")
      .insert(rows.map((r) => ({ ...r, empresa_id: nc.empresa_id })))
    if (insErr) return { error: { _form: [insErr.message] } }
  }

  revalidatePath(`/nao-conformidades/${ncId}`)
  return { ok: true }
}

// -----------------------------------------------------------------------------
// Ação Corretiva CRUD
// -----------------------------------------------------------------------------

function parseAcForm(formData: FormData, ncId: string) {
  return {
    nao_conformidade_id: ncId,
    numero_sequencial: Number(formData.get("numero_sequencial") ?? 0) || 1,
    tipo: (formData.get("tipo") as string) || "corretiva",
    descricao: ((formData.get("descricao") as string) || "").trim(),
    responsavel_nome: opt(formData, "responsavel_nome"),
    responsavel_id: opt(formData, "responsavel_id"),
    data_prazo: ((formData.get("data_prazo") as string) || "").trim(),
    data_inicio: opt(formData, "data_inicio"),
    data_conclusao: opt(formData, "data_conclusao"),
    status: (formData.get("status") as string) || "planejada",
    evidencia_eficacia: opt(formData, "evidencia_eficacia"),
    verificado_em: opt(formData, "verificado_em"),
    verificado_por_nome: opt(formData, "verificado_por_nome"),
    eficaz:
      formData.get("eficaz") === "sim"
        ? true
        : formData.get("eficaz") === "nao"
          ? false
          : null,
    observacoes: opt(formData, "observacoes"),
  }
}

export async function createAc(ncId: string, formData: FormData) {
  const parsed = ncAcaoCorretivaSchema.safeParse(parseAcForm(formData, ncId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: nc } = await supabase
    .from("nao_conformidades")
    .select("empresa_id")
    .eq("id", ncId)
    .single<{ empresa_id: string }>()
  if (!nc) return { error: { _form: ["NC não encontrada"] } }

  const { error } = await supabase
    .from("nc_acoes_corretivas")
    .insert({ ...parsed.data, empresa_id: nc.empresa_id })

  if (error) {
    if (error.code === "23505") {
      return { error: { _form: ["Já existe AC com este número sequencial nesta NC"] } }
    }
    return { error: { _form: [error.message] } }
  }
  revalidatePath(`/nao-conformidades/${ncId}`)
  return { ok: true }
}

export async function updateAc(acId: string, ncId: string, formData: FormData) {
  const parsed = ncAcaoCorretivaSchema.safeParse(parseAcForm(formData, ncId))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase
    .from("nc_acoes_corretivas")
    .update(parsed.data)
    .eq("id", acId)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/nao-conformidades/${ncId}`)
  return { ok: true }
}

export async function deleteAc(acId: string, ncId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("nc_acoes_corretivas").delete().eq("id", acId)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath(`/nao-conformidades/${ncId}`)
  return { ok: true }
}

// -----------------------------------------------------------------------------
// Promover ocorrência → NC formal
// Pré-preenche título/descrição/origem a partir da ocorrência e linka.
// -----------------------------------------------------------------------------

export async function promoverOcorrenciaParaNc(ocorrenciaId: string) {
  const supabase = await createClient()

  const { data: oc } = await supabase
    .from("ocorrencias")
    .select("id, empresa_id, descricao, local, gravidade, data_ocorrencia, causa_raiz, investigacao")
    .eq("id", ocorrenciaId)
    .single<{
      id: string
      empresa_id: string
      descricao: string
      local: string
      gravidade: string | null
      data_ocorrencia: string
      causa_raiz: string | null
      investigacao: { porques?: string[] } | null
    }>()
  if (!oc) return { error: { _form: ["Ocorrência não encontrada"] } }

  // Verifica se já existe NC linkada
  const { data: ncExist } = await supabase
    .from("nao_conformidades")
    .select("id")
    .eq("ocorrencia_id", ocorrenciaId)
    .limit(1)
    .maybeSingle()
  if (ncExist) {
    revalidatePath(`/ocorrencias/${ocorrenciaId}`)
    redirect(`/nao-conformidades/${ncExist.id}`)
  }

  const severidade =
    oc.gravidade === "fatal" || oc.gravidade === "grave"
      ? "critica"
      : oc.gravidade === "moderado"
        ? "alta"
        : "media"

  const tituloBase = oc.descricao.slice(0, 80).trim()
  const titulo = tituloBase.length === 80 ? tituloBase + "…" : tituloBase

  const { data: nc, error } = await supabase
    .from("nao_conformidades")
    .insert({
      empresa_id: oc.empresa_id,
      ocorrencia_id: ocorrenciaId,
      titulo: titulo || `Ocorrência em ${oc.local}`,
      descricao: oc.descricao,
      origem: "ocorrencia",
      data_identificacao: oc.data_ocorrencia.slice(0, 10),
      severidade,
      status: "em_analise",
      causa_raiz_consolidada: oc.causa_raiz,
    })
    .select("id, empresa_id")
    .single()

  if (error) return { error: { _form: [error.message] } }

  // Migra os 5 Whys legados (JSONB → tabela) se existirem
  const porquesLegados = oc.investigacao?.porques
  if (porquesLegados && Array.isArray(porquesLegados)) {
    const rows = porquesLegados
      .map((resposta, i) =>
        resposta.trim() === ""
          ? null
          : {
              empresa_id: nc.empresa_id,
              nao_conformidade_id: nc.id,
              ordem: i + 1,
              pergunta: i === 0 ? "Por quê aconteceu?" : `Por quê (nível ${i + 1})?`,
              resposta: resposta.trim(),
              eh_causa_raiz: i === porquesLegados.length - 1,
            },
      )
      .filter((r): r is NonNullable<typeof r> => r !== null)
    if (rows.length > 0) {
      await supabase.from("nc_causa_5whys").insert(rows)
    }
  }

  revalidatePath(`/ocorrencias/${ocorrenciaId}`)
  revalidatePath("/nao-conformidades")
  redirect(`/nao-conformidades/${nc.id}`)
}

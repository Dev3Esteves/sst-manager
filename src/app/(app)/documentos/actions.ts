"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { aprSchema, autorizacaoNrSchema } from "@/lib/validations/documento"
import { ptSchema } from "@/lib/validations/pt"

type AprPayload = z.input<typeof aprSchema> & {
  assinaturas?: { nome: string; papel: string; assinatura_data_url?: string }[]
}

export async function createApr(payload: AprPayload) {
  const parsed = aprSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ["Não autenticado"] } }

  const { data: colab } = await supabase
    .from("usuarios")
    .select("colaborador_id")
    .eq("id", user.id)
    .single()

  const { data, error } = await supabase.from("documentos_sst").insert({
    tipo: "apr",
    titulo: `APR — ${parsed.data.local_trabalho}`,
    empresa_id: parsed.data.empresa_id,
    local_trabalho: parsed.data.local_trabalho,
    data_emissao: parsed.data.data_emissao,
    data_validade: parsed.data.data_validade,
    status: "emitido",
    elaborado_por: colab?.colaborador_id ?? null,
    conteudo: {
      equipe: parsed.data.equipe,
      riscos: parsed.data.riscos,
      epis: parsed.data.epis,
      observacoes: parsed.data.observacoes,
      assinaturas: payload.assinaturas ?? [],
    },
  }).select("id, numero_sequencial").single()

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/documentos")
  redirect(`/documentos/${data.id}`)
}

export type PtPayload = z.input<typeof ptSchema> & {
  assinatura_solicitante_data_url?: string
  assinatura_executante_data_url?: string
  assinatura_aprovador_data_url?: string
}

export async function createPt(payload: PtPayload) {
  const parsed = ptSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ["Não autenticado"] } }

  const { data: link } = await supabase
    .from("usuarios").select("colaborador_id").eq("id", user.id).single()

  const conteudo = {
    tipo_pt: parsed.data.tipo,
    descricao_tarefa: parsed.data.descricao_tarefa,
    hora_inicio: parsed.data.hora_inicio,
    hora_fim: parsed.data.hora_fim,
    solicitante: parsed.data.solicitante,
    executante: parsed.data.executante,
    aprovador: parsed.data.aprovador,
    checklist: parsed.data.checklist,
    medidas_especificas: parsed.data.medidas_especificas,
    assinatura_solicitante_data_url: payload.assinatura_solicitante_data_url,
    assinatura_executante_data_url: payload.assinatura_executante_data_url,
    assinatura_aprovador_data_url: payload.assinatura_aprovador_data_url,
  }

  const { data, error } = await supabase.from("documentos_sst").insert({
    tipo: "pt",
    titulo: `PT ${parsed.data.tipo} — ${parsed.data.local_trabalho}`,
    empresa_id: parsed.data.empresa_id,
    local_trabalho: parsed.data.local_trabalho,
    data_emissao: parsed.data.data_emissao,
    status: "emitido",
    elaborado_por: link?.colaborador_id ?? null,
    conteudo,
  }).select("id").single()

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/documentos")
  redirect(`/documentos/${data.id}`)
}

export async function cancelarDocumento(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("documentos_sst").update({ status: "cancelado" }).eq("id", id)
  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/documentos")
  redirect("/documentos")
}

export type AutorizacaoNrPayload = z.input<typeof autorizacaoNrSchema> & {
  assinatura_colaborador_data_url?: string
  assinatura_responsavel_data_url?: string
}

export async function createAutorizacaoNr(payload: AutorizacaoNrPayload) {
  const parsed = autorizacaoNrSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: { _form: [parsed.error.errors[0]?.message || "Dados inválidos"] } }
  }
  const supabase = await createClient()

  // Valida pré-requisitos: colaborador tem exame vigente + treinamento(s) vigentes da NR
  const [{ data: exames }, { data: treinamentos }] = await Promise.all([
    supabase.from("exames_medicos")
      .select("tipo, subtipo, data_realizacao, data_vencimento, resultado")
      .eq("colaborador_id", parsed.data.colaborador_id)
      .eq("status", "vigente")
      .in("resultado", ["apto", "apto_restricao"])
      .order("data_vencimento", { ascending: false }),
    supabase.from("treinamentos_realizados")
      .select("data_realizacao, data_vencimento, treinamentos(titulo, nr_referencia, carga_horaria_horas)")
      .eq("colaborador_id", parsed.data.colaborador_id)
      .eq("status", "vigente")
      .order("data_vencimento", { ascending: false }),
  ])

  const treinamentosDaNr = (treinamentos ?? []).filter((t) => {
    const tr = Array.isArray(t.treinamentos) ? t.treinamentos[0] : t.treinamentos
    return tr?.nr_referencia === parsed.data.nr
  })

  if (treinamentosDaNr.length === 0) {
    return { error: { _form: [`Sem treinamento vigente de ${parsed.data.nr} para este colaborador.`] } }
  }
  if ((exames ?? []).length === 0) {
    return { error: { _form: ["Sem ASO vigente (apto) para este colaborador."] } }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: link } = await supabase.from("usuarios").select("colaborador_id").eq("id", user!.id).single()

  const { data: colab } = await supabase.from("colaboradores")
    .select("nome_completo, cpf, matricula, cargos(titulo)")
    .eq("id", parsed.data.colaborador_id).single()

  const cargo = Array.isArray(colab?.cargos) ? colab?.cargos[0] : colab?.cargos

  const conteudo = {
    nr: parsed.data.nr,
    colaborador: {
      nome: colab?.nome_completo ?? "",
      cpf: colab?.cpf ?? "",
      matricula: colab?.matricula ?? null,
      cargo: cargo?.titulo ?? null,
    },
    treinamentos_validos: treinamentosDaNr.map((t) => {
      const tr = Array.isArray(t.treinamentos) ? t.treinamentos[0] : t.treinamentos
      return {
        titulo: tr?.titulo ?? "",
        carga: tr?.carga_horaria_horas ?? 0,
        data_realizacao: t.data_realizacao,
        data_vencimento: t.data_vencimento,
      }
    }),
    exames_validos: (exames ?? []).map((e) => ({
      tipo: e.tipo + (e.subtipo ? ` — ${e.subtipo}` : ""),
      data_realizacao: e.data_realizacao,
      data_vencimento: e.data_vencimento,
      resultado: e.resultado ?? "",
    })),
    escopo_autorizacao: parsed.data.escopo_autorizacao,
    responsavel_nome: parsed.data.responsavel_nome,
    responsavel_cargo: parsed.data.responsavel_cargo,
    assinatura_colaborador_data_url: payload.assinatura_colaborador_data_url,
    assinatura_responsavel_data_url: payload.assinatura_responsavel_data_url,
  }

  const tipoKey = { "NR-10": "autorizacao_nr10", "NR-35": "autorizacao_nr35", "NR-33": "autorizacao_nr33" }[parsed.data.nr]

  const { data, error } = await supabase.from("documentos_sst").insert({
    tipo: tipoKey,
    titulo: `Autorização ${parsed.data.nr} — ${colab?.nome_completo}`,
    empresa_id: parsed.data.empresa_id,
    data_emissao: parsed.data.data_emissao,
    data_validade: parsed.data.data_validade,
    status: "emitido",
    elaborado_por: link?.colaborador_id ?? null,
    conteudo,
  }).select("id").single()

  if (error) return { error: { _form: [error.message] } }
  revalidatePath("/documentos")
  redirect(`/documentos/${data.id}`)
}

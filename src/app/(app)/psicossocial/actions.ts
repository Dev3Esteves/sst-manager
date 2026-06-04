"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { campanhaPsiSchema } from "@/lib/validations/psicossocial"
import {
  COPSOQ_BR,
  COPSOQ_META,
  CLASSIFICACAO_TERCIS,
} from "@/lib/psicossocial/copsoq"
import {
  processarGHE,
  classificacaoParaCategoriaRiscoPGR,
  type Respondente,
} from "@/lib/psicossocial/scoring"

type ActionResult = { ok: true; id?: string } | { error: string }

const ROLES = ["admin", "tec_seguranca"] as const

function novoToken(): string {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "")
}

/** Garante (upsert) o instrumento COPSOQ padrão no catálogo. Via service role. */
async function garantirInstrumentoId(): Promise<string> {
  const admin = createAdminClient()
  const nome = COPSOQ_META.instrumento
  const versao = COPSOQ_META.versao_schema
  const { data: existente } = await admin
    .from("psi_instrumento")
    .select("id")
    .eq("nome", nome)
    .eq("versao", versao)
    .maybeSingle()
  if (existente) return existente.id as string

  const { data, error } = await admin
    .from("psi_instrumento")
    .insert({ nome, versao, definicao: COPSOQ_BR, oficial: COPSOQ_META.oficial, ativo: true })
    .select("id")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Falha ao registrar instrumento")
  return data.id as string
}

export async function criarCampanha(formData: FormData): Promise<ActionResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }

  const parsed = campanhaPsiSchema.safeParse({
    pgr_id: formData.get("pgr_id"),
    instrumento_id: "00000000-0000-4000-8000-000000000000", // placeholder; resolvido abaixo
    titulo: formData.get("titulo"),
    versao_aplicada: formData.get("versao_aplicada") || "curto",
    data_inicio: formData.get("data_inicio"),
    data_fim: (formData.get("data_fim") as string) || null,
    min_respondentes: formData.get("min_respondentes") || 5,
  })
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" }

  // empresa_id derivado do PGR (RLS garante que é da empresa do usuário)
  const { data: pgr } = await supabase
    .from("pgr")
    .select("id, empresa_id")
    .eq("id", parsed.data.pgr_id)
    .maybeSingle()
  if (!pgr) return { error: "PGR não encontrado ou sem acesso." }

  const instrumentoId = await garantirInstrumentoId()

  const { data: campanha, error } = await supabase
    .from("psi_campanha")
    .insert({
      empresa_id: pgr.empresa_id,
      pgr_id: pgr.id,
      instrumento_id: instrumentoId,
      titulo: parsed.data.titulo,
      versao_aplicada: parsed.data.versao_aplicada,
      data_inicio: parsed.data.data_inicio,
      data_fim: parsed.data.data_fim,
      min_respondentes: parsed.data.min_respondentes,
      status: "rascunho",
    })
    .select("id")
    .single()
  if (error || !campanha) return { error: error?.message ?? "Falha ao criar campanha" }

  // Gera 1 convite (link/QR anônimo) por GHE do PGR
  const { data: ghes } = await supabase
    .from("pgr_ghe")
    .select("id")
    .eq("pgr_id", pgr.id)
  if (ghes && ghes.length > 0) {
    const convites = ghes.map((g) => ({
      empresa_id: pgr.empresa_id,
      campanha_id: campanha.id,
      pgr_ghe_id: g.id,
      token: novoToken(),
    }))
    await supabase.from("psi_convite").insert(convites)
  }

  revalidatePath("/psicossocial")
  redirect(`/psicossocial/${campanha.id}`)
}

/**
 * Gera/atualiza os links (convites anônimos) por GHE: cria um convite para
 * cada GHE do PGR que ainda não tem. Idempotente — pode ser chamado depois de
 * adicionar GHEs ao PGR, sem duplicar os existentes.
 */
export async function sincronizarConvites(id: string): Promise<ActionResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }

  const { data: campanha } = await supabase
    .from("psi_campanha")
    .select("id, pgr_id, empresa_id")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) return { error: "Campanha não encontrada." }

  const { data: ghes } = await supabase.from("pgr_ghe").select("id").eq("pgr_id", campanha.pgr_id)
  if (!ghes || ghes.length === 0) {
    return { error: "O PGR não tem GHEs cadastrados. Cadastre os GHEs no PGR primeiro." }
  }

  const { data: existentes } = await supabase
    .from("psi_convite")
    .select("pgr_ghe_id")
    .eq("campanha_id", id)
  const jaTem = new Set((existentes ?? []).map((e) => e.pgr_ghe_id))

  const novos = ghes
    .filter((g) => !jaTem.has(g.id))
    .map((g) => ({
      empresa_id: campanha.empresa_id,
      campanha_id: id,
      pgr_ghe_id: g.id,
      token: novoToken(),
    }))
  if (novos.length === 0) return { error: "Todos os GHEs do PGR já têm link gerado." }

  const { error } = await supabase.from("psi_convite").insert(novos)
  if (error) return { error: error.message }

  revalidatePath(`/psicossocial/${id}`)
  return { ok: true, id: `${novos.length}` }
}

export async function mudarStatusCampanha(
  id: string,
  status: "aberta" | "encerrada",
): Promise<ActionResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }
  const { error } = await supabase.from("psi_campanha").update({ status }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/psicossocial/${id}`)
  return { ok: true }
}

/**
 * Calcula os resultados por GHE/dimensão a partir das respostas anônimas.
 * Lê respostas cruas via service role (RLS deny-all). Marca campanha 'analisada'.
 */
export async function calcularResultados(id: string): Promise<ActionResult> {
  try {
    await requireRole(ROLES)
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }
  const admin = createAdminClient()

  const { data: campanha } = await admin
    .from("psi_campanha")
    .select("id, empresa_id, versao_aplicada, min_respondentes")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) return { error: "Campanha não encontrada." }

  const { data: respostas } = await admin
    .from("psi_resposta")
    .select("id, pgr_ghe_id")
    .eq("campanha_id", id)
  if (!respostas || respostas.length === 0) return { error: "Ainda não há respostas para calcular." }

  const { data: itens } = await admin
    .from("psi_resposta_item")
    .select("resposta_id, item_id, valor")
    .in("resposta_id", respostas.map((r) => r.id))

  // Monta respondentes por GHE
  const porResposta = new Map<string, Respondente>()
  for (const it of itens ?? []) {
    const r = porResposta.get(it.resposta_id) ?? {}
    r[it.item_id] = it.valor
    porResposta.set(it.resposta_id, r)
  }
  const porGhe = new Map<string, Respondente[]>()
  for (const resp of respostas) {
    const arr = porGhe.get(resp.pgr_ghe_id) ?? []
    arr.push(porResposta.get(resp.id) ?? {})
    porGhe.set(resp.pgr_ghe_id, arr)
  }

  // Limpa resultados anteriores e recalcula
  await admin.from("psi_resultado_dimensao").delete().eq("campanha_id", id)

  const linhas: Record<string, unknown>[] = []
  for (const [gheId, respondentes] of Array.from(porGhe.entries())) {
    const resultados = processarGHE(
      COPSOQ_BR,
      respondentes,
      campanha.versao_aplicada as "curto" | "medio",
      campanha.min_respondentes ?? CLASSIFICACAO_TERCIS.min_respondentes_ghe,
    )
    for (const res of resultados) {
      linhas.push({
        empresa_id: campanha.empresa_id,
        campanha_id: id,
        pgr_ghe_id: gheId,
        dominio: res.dominio,
        dimensao_id: res.dimensao_id,
        dimensao_nome: res.dimensao,
        score_risco: res.score,
        classificacao: res.classificacao,
        n_respondentes: res.n,
        suprimido: res.suprimido,
      })
    }
  }
  if (linhas.length > 0) {
    const { error } = await admin.from("psi_resultado_dimensao").insert(linhas)
    if (error) return { error: error.message }
  }

  await admin.from("psi_campanha").update({ status: "analisada" }).eq("id", id)
  revalidatePath(`/psicossocial/${id}`)
  return { ok: true }
}

/**
 * Lança as dimensões em risco médio/alto no Inventário de Riscos do PGR
 * (pgr_risco categoria='psicossocial'). Evita duplicar (mesmo GHE+agente).
 */
export async function lancarNoInventarioPgr(id: string): Promise<ActionResult> {
  let supabase
  try {
    ;({ supabase } = await requireRole(ROLES))
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }

  const { data: campanha } = await supabase
    .from("psi_campanha")
    .select("id, pgr_id, empresa_id")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) return { error: "Campanha não encontrada." }

  const { data: resultados } = await supabase
    .from("psi_resultado_dimensao")
    .select("pgr_ghe_id, dimensao_nome, score_risco, classificacao, suprimido")
    .eq("campanha_id", id)
  const alvo = (resultados ?? []).filter(
    (r) => !r.suprimido && (r.classificacao === "amarelo" || r.classificacao === "vermelho"),
  )
  if (alvo.length === 0) return { error: "Nenhum risco médio/alto para lançar (ou ainda não calculado)." }

  // Riscos psicossociais já lançados (evita duplicar)
  const { data: existentes } = await supabase
    .from("pgr_risco")
    .select("pgr_ghe_id, agente_ambiental")
    .eq("pgr_id", campanha.pgr_id)
    .eq("categoria", "psicossocial")
  const jaTem = new Set((existentes ?? []).map((e) => `${e.pgr_ghe_id}::${e.agente_ambiental}`))

  const novos = alvo
    .filter((r) => !jaTem.has(`${r.pgr_ghe_id}::${r.dimensao_nome}`))
    .map((r) => ({
      empresa_id: campanha.empresa_id,
      pgr_id: campanha.pgr_id,
      pgr_ghe_id: r.pgr_ghe_id,
      categoria: "psicossocial",
      agente_ambiental: r.dimensao_nome,
      fontes_geradoras: "Organização do trabalho (avaliação COPSOQ)",
      possiveis_danos: "Estresse ocupacional, transtornos mentais relacionados ao trabalho",
      categoria_risco: classificacaoParaCategoriaRiscoPGR(
        r.classificacao as "amarelo" | "vermelho",
      ),
      observacoes: `Origem: avaliação psicossocial (COPSOQ). Score de risco ${r.score_risco}.`,
    }))

  if (novos.length === 0) return { error: "Todos os riscos desta campanha já constam no inventário." }

  const { error } = await supabase.from("pgr_risco").insert(novos)
  if (error) return { error: error.message }

  revalidatePath(`/psicossocial/${id}`)
  return { ok: true, id: `${novos.length}` }
}

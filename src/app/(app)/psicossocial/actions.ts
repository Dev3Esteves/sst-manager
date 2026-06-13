"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole, AuthError } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { campanhaPsiSchema } from "@/lib/validations/psicossocial"
import { CLASSIFICACAO_TERCIS } from "@/lib/psicossocial/copsoq"
import {
  getInstrumento,
  definicaoArmazenada,
  INSTRUMENTO_PADRAO,
} from "@/lib/psicossocial/instrumentos"
import { PERGUNTAS_QUALITATIVAS_PADRAO, perguntasDaCampanha } from "@/lib/psicossocial/qualitativo"
import { sintetizarQualitativo, type RespostaAberta } from "@/lib/ia/sintese-qualitativa"
import { IAServiceUnavailable } from "@/lib/ia/classificar-risco"
import {
  processarInstrumento,
  probabilidadeDoScore,
  nivelRiscoNR1,
  nivelNR1ParaCategoriaRiscoPGR,
  distribuicaoRiscoPorDimensao,
  calibrarFaixasPercentil,
  aplicarFaixasPorDimensao,
  PERCENTIS_PADRAO,
  MIN_AMOSTRAL_CALIBRACAO,
  type InstrumentoDef,
  type FaixaDef,
  type NivelNR1,
  type Respondente,
} from "@/lib/psicossocial/scoring"

type ActionResult = { ok: true; id?: string } | { error: string }

const ROLES = ["admin", "tec_seguranca"] as const

function novoToken(): string {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "")
}

/**
 * Garante (upsert) um instrumento do registro no catálogo, gravando a definição
 * completa (domínios + faixas + escala + key) usada pelo formulário e cálculo.
 * Via service role. Retorna o id do psi_instrumento.
 */
async function garantirInstrumento(key: string): Promise<string> {
  const reg = getInstrumento(key)
  if (!reg) throw new Error(`Instrumento desconhecido: ${key}`)
  const admin = createAdminClient()
  const { data: existente } = await admin
    .from("psi_instrumento")
    .select("id")
    .eq("nome", reg.nome)
    .eq("versao", reg.versao_schema)
    .maybeSingle()

  const payload = {
    nome: reg.nome,
    versao: reg.versao_schema,
    definicao: definicaoArmazenada(reg),
    oficial: reg.oficial,
    ativo: true,
  }
  if (existente) {
    // Mantém a definição atualizada (faixas/escala/key) ao reusar.
    await admin.from("psi_instrumento").update({ definicao: payload.definicao }).eq("id", existente.id)
    return existente.id as string
  }
  const { data, error } = await admin
    .from("psi_instrumento")
    .insert(payload)
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
    instrumento_key: formData.get("instrumento_key") || INSTRUMENTO_PADRAO,
    titulo: formData.get("titulo"),
    versao_aplicada: formData.get("versao_aplicada") || "curto",
    data_inicio: formData.get("data_inicio"),
    data_fim: (formData.get("data_fim") as string) || null,
    min_respondentes: formData.get("min_respondentes") || 5,
    modo_qualitativo: formData.get("modo_qualitativo") || "nenhum",
  })
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" }

  // Resolve e valida o instrumento + a versão escolhida.
  const reg = getInstrumento(parsed.data.instrumento_key)
  if (!reg) return { error: "Instrumento inválido." }
  if (!reg.versoes.some((v) => v.value === parsed.data.versao_aplicada)) {
    return { error: "Versão inválida para o instrumento escolhido." }
  }

  // empresa_id derivado do PGR (RLS garante que é da empresa do usuário)
  const { data: pgr } = await supabase
    .from("pgr")
    .select("id, empresa_id")
    .eq("id", parsed.data.pgr_id)
    .maybeSingle()
  if (!pgr) return { error: "PGR não encontrado ou sem acesso." }

  const instrumentoId = await garantirInstrumento(reg.key)

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
      modo_qualitativo: parsed.data.modo_qualitativo,
      perguntas_qualitativas:
        parsed.data.modo_qualitativo === "nenhum" ? null : PERGUNTAS_QUALITATIVAS_PADRAO,
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
    .select("id, empresa_id, versao_aplicada, min_respondentes, psi_instrumento(definicao)")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) return { error: "Campanha não encontrada." }

  // Definição do instrumento desta campanha (data-driven). Fallback defensivo
  // ao COPSOQ do registro caso o JSONB esteja ausente.
  const instr = Array.isArray(campanha.psi_instrumento)
    ? campanha.psi_instrumento[0]
    : campanha.psi_instrumento
  const definicao = (instr?.definicao ?? getInstrumento(INSTRUMENTO_PADRAO)?.def) as InstrumentoDef

  // Calibração por percentis da empresa (se houver): injeta a faixa de corte de
  // cada dimensão na definição. Sem calibração, processa com a faixa do
  // instrumento (tercis). Ver calibrarFaixas + migration 0056.
  const definicaoEfetiva = await aplicarCalibracao(
    admin,
    definicao,
    campanha.empresa_id as string,
    campanha.versao_aplicada as string,
  )

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
    const resultados = processarInstrumento(
      definicaoEfetiva,
      respondentes,
      campanha.versao_aplicada as string,
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
        tipo: res.tipo,
        nivel_desfecho: res.nivel_desfecho ?? null,
        // Probabilidade NR-1 só para fatores de exposição (desfecho não vai ao PGR).
        probabilidade:
          res.suprimido || res.tipo === "desfecho" ? null : probabilidadeDoScore(res.score),
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

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Carrega a calibração por percentis da empresa (se houver) e devolve a
 * definição com a faixa de corte de cada dimensão injetada. Sem calibração,
 * devolve a definição original (faixa do instrumento / tercis).
 */
async function aplicarCalibracao(
  admin: AdminClient,
  definicao: InstrumentoDef,
  empresaId: string,
  versao: string,
): Promise<InstrumentoDef> {
  const instrKey = (definicao as { key?: string }).key
  if (!instrKey) return definicao
  const { data: cal } = await admin
    .from("psi_calibracao")
    .select("dimensao_id, verde_max, amarelo_max")
    .eq("empresa_id", empresaId)
    .eq("instrumento_key", instrKey)
    .eq("versao", versao)
  if (!cal || cal.length === 0) return definicao
  const faixasPorDim = new Map<string, FaixaDef>(
    cal.map((c) => [
      c.dimensao_id as string,
      { verdeMax: Number(c.verde_max), amareloMax: Number(c.amarelo_max) },
    ]),
  )
  return aplicarFaixasPorDimensao(definicao, faixasPorDim)
}

/**
 * Calibra as faixas de corte (verde/amarelo/vermelho) por percentis das
 * respostas acumuladas DA PRÓPRIA EMPRESA para este instrumento+versão — uma
 * norma relativa por dimensão (P50/P80 por padrão), em vez de tercis fixos.
 *
 * Só para instrumentos `calibravel` (cortes arbitrários: COPSOQ/HSE). Cortes
 * ancorados (PROART/CBI/DASS) não são recalibrados. Após gravar a calibração,
 * recalcula os resultados desta campanha aplicando-a.
 */
export async function calibrarFaixas(id: string): Promise<ActionResult> {
  try {
    await requireRole(ROLES)
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }
  const admin = createAdminClient()

  const { data: campanha } = await admin
    .from("psi_campanha")
    .select("id, empresa_id, versao_aplicada, instrumento_id, psi_instrumento(definicao)")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) return { error: "Campanha não encontrada." }

  const instr = Array.isArray(campanha.psi_instrumento)
    ? campanha.psi_instrumento[0]
    : campanha.psi_instrumento
  const definicao = (instr?.definicao ?? getInstrumento(INSTRUMENTO_PADRAO)?.def) as InstrumentoDef
  const instrKey = (definicao as { key?: string }).key
  const reg = instrKey ? getInstrumento(instrKey) : undefined
  if (!reg?.calibravel) {
    return {
      error:
        "Este instrumento usa cortes ancorados (clínicos/protocolo) e não é calibrável por percentis.",
    }
  }

  const empresaId = campanha.empresa_id as string
  const versao = campanha.versao_aplicada as string

  // Referência = todas as campanhas DESTA empresa com o mesmo instrumento+versão.
  const { data: camps } = await admin
    .from("psi_campanha")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("instrumento_id", campanha.instrumento_id)
    .eq("versao_aplicada", versao)
  const campIds = (camps ?? []).map((c) => c.id as string)

  const { data: respostas } = await admin
    .from("psi_resposta")
    .select("id")
    .in("campanha_id", campIds)
  const respIds = (respostas ?? []).map((r) => r.id as string)
  if (respIds.length === 0) return { error: "Ainda não há respostas desta empresa para calibrar." }

  const { data: itens } = await admin
    .from("psi_resposta_item")
    .select("resposta_id, item_id, valor")
    .in("resposta_id", respIds)

  const porResposta = new Map<string, Respondente>()
  for (const it of itens ?? []) {
    const r = porResposta.get(it.resposta_id) ?? {}
    r[it.item_id] = it.valor
    porResposta.set(it.resposta_id, r)
  }
  const respondentes = Array.from(porResposta.values())

  const distribuicao = distribuicaoRiscoPorDimensao(definicao, respondentes, versao)
  const faixas = calibrarFaixasPercentil(distribuicao, {
    pVerde: PERCENTIS_PADRAO.pVerde,
    pAmarelo: PERCENTIS_PADRAO.pAmarelo,
    minN: MIN_AMOSTRAL_CALIBRACAO,
  })
  if (faixas.size === 0) {
    return {
      error: `Amostra insuficiente para calibrar (mínimo ${MIN_AMOSTRAL_CALIBRACAO} respondentes por dimensão; base atual: ${respondentes.length}).`,
    }
  }

  // Substitui a calibração anterior desta empresa+instrumento+versão.
  await admin
    .from("psi_calibracao")
    .delete()
    .eq("empresa_id", empresaId)
    .eq("instrumento_key", instrKey)
    .eq("versao", versao)
  const linhas = Array.from(faixas.entries()).map(([dimId, f]) => ({
    empresa_id: empresaId,
    instrumento_key: instrKey,
    versao,
    dimensao_id: dimId,
    verde_max: f.verdeMax,
    amarelo_max: f.amareloMax,
    p_verde: f.pVerde,
    p_amarelo: f.pAmarelo,
    n_amostral: f.n,
  }))
  const { error: errIns } = await admin.from("psi_calibracao").insert(linhas)
  if (errIns) return { error: errIns.message }

  // Recalcula os resultados desta campanha já aplicando a nova calibração.
  const rec = await calcularResultados(id)
  if ("error" in rec) return rec

  revalidatePath(`/psicossocial/${id}`)
  return { ok: true, id: `${faixas.size} dimensões` }
}

/** Uma avaliação técnica de severidade/exposição para um resultado (GHE × dimensão). */
export type AvaliacaoSeveridadeInput = {
  pgr_ghe_id: string
  dimensao_id: string
  severidade: number // 1-5
  exposicao?: number | null // 1-5 ou null (matriz P×S)
}

/**
 * Registra a avaliação técnica (Severidade × Exposição) sobre a Probabilidade
 * já calculada do questionário e grava o nível de risco NR-1 por dimensão.
 * A NR-1 exige essa etapa: o questionário sozinho não determina o nível.
 */
export async function avaliarSeveridade(
  id: string,
  avaliacoes: AvaliacaoSeveridadeInput[],
): Promise<ActionResult> {
  try {
    await requireRole(ROLES)
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }
  if (!avaliacoes || avaliacoes.length === 0) return { error: "Nada para avaliar." }
  const admin = createAdminClient()

  // Lê os resultados (com a probabilidade derivada do score) desta campanha.
  const { data: resultados } = await admin
    .from("psi_resultado_dimensao")
    .select("id, pgr_ghe_id, dimensao_id, probabilidade, suprimido")
    .eq("campanha_id", id)
  if (!resultados || resultados.length === 0) {
    return { error: "Calcule os resultados antes de avaliar a severidade." }
  }
  const porChave = new Map(resultados.map((r) => [`${r.pgr_ghe_id}::${r.dimensao_id}`, r]))

  let atualizados = 0
  for (const av of avaliacoes) {
    const alvo = porChave.get(`${av.pgr_ghe_id}::${av.dimensao_id}`)
    if (!alvo || alvo.suprimido || alvo.probabilidade == null) continue
    const nr1 = nivelRiscoNR1(alvo.probabilidade as number, av.severidade, av.exposicao ?? null)
    const { error } = await admin
      .from("psi_resultado_dimensao")
      .update({
        severidade: nr1.severidade,
        exposicao: nr1.exposicao,
        produto_nr1: nr1.produto,
        nivel_risco_nr1: nr1.nivel,
        severidade_em: new Date().toISOString(),
      })
      .eq("id", alvo.id)
    if (error) return { error: error.message }
    atualizados++
  }
  if (atualizados === 0) return { error: "Nenhuma dimensão elegível foi avaliada (verifique supressão/cálculo)." }

  revalidatePath(`/psicossocial/${id}`)
  return { ok: true, id: `${atualizados}` }
}

/**
 * Lança no Inventário de Riscos do PGR (pgr_risco categoria='psicossocial') as
 * dimensões cujo NÍVEL DE RISCO NR-1 (avaliação técnica P×S×E) seja médio, alto
 * ou crítico. Exige a etapa de severidade — o score do questionário sozinho não
 * basta (NR-1). Evita duplicar (mesmo GHE+agente).
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
    .select("pgr_ghe_id, dimensao_nome, score_risco, nivel_risco_nr1, suprimido, tipo")
    .eq("campanha_id", id)

  // Desfechos (sofrimento/danos) não vão ao PGR — apenas fatores de exposição.
  const elegiveis = (resultados ?? []).filter((r) => !r.suprimido && r.tipo !== "desfecho")
  const semAvaliacao = elegiveis.filter((r) => r.nivel_risco_nr1 == null)
  if (elegiveis.length > 0 && semAvaliacao.length === elegiveis.length) {
    return { error: "Avalie a severidade técnica (P×S×E) antes de lançar no PGR. O questionário sozinho não determina o nível (NR-1)." }
  }

  const alvo = elegiveis.filter(
    (r) => r.nivel_risco_nr1 === "medio" || r.nivel_risco_nr1 === "alto" || r.nivel_risco_nr1 === "critico",
  )
  if (alvo.length === 0) return { error: "Nenhum risco médio/alto/crítico (NR-1) para lançar." }

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
      fontes_geradoras: "Organização do trabalho (avaliação psicossocial)",
      possiveis_danos: "Estresse ocupacional, transtornos mentais relacionados ao trabalho",
      categoria_risco: nivelNR1ParaCategoriaRiscoPGR(r.nivel_risco_nr1 as NivelNR1),
      observacoes: `Origem: avaliação psicossocial. Score ${r.score_risco}; nível NR-1: ${r.nivel_risco_nr1}.`,
    }))

  if (novos.length === 0) return { error: "Todos os riscos desta campanha já constam no inventário." }

  const { error } = await supabase.from("pgr_risco").insert(novos)
  if (error) return { error: error.message }

  revalidatePath(`/psicossocial/${id}`)
  return { ok: true, id: `${novos.length}` }
}

/**
 * Gera (via IA) a síntese temática das respostas ABERTAS por GHE. Lê as respostas
 * anônimas via service role, agrupa por GHE, SUPRIME GHE com menos respondentes
 * (lotes distintos) que o mínimo (k-anonimato), chama o Claude e faz upsert em
 * psi_sintese_qualitativa (revisado=false — exige revisão p/ liberar verbatim).
 */
export async function gerarSinteseQualitativa(id: string): Promise<ActionResult> {
  try {
    await requireRole(ROLES)
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }
  const admin = createAdminClient()

  const { data: campanha } = await admin
    .from("psi_campanha")
    .select("id, empresa_id, min_respondentes, perguntas_qualitativas")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) return { error: "Campanha não encontrada." }

  const perguntas = perguntasDaCampanha(campanha.perguntas_qualitativas)
  const { data: respostas } = await admin
    .from("psi_resposta_qualitativa")
    .select("pgr_ghe_id, lote_id, pergunta_texto, resposta_texto")
    .eq("campanha_id", id)
  if (!respostas || respostas.length === 0) {
    return { error: "Ainda não há respostas abertas para sintetizar." }
  }

  const porGhe = new Map<string, { respostas: RespostaAberta[]; lotes: Set<string> }>()
  for (const r of respostas) {
    const g = porGhe.get(r.pgr_ghe_id) ?? { respostas: [], lotes: new Set<string>() }
    g.respostas.push({ pergunta: r.pergunta_texto, texto: r.resposta_texto })
    g.lotes.add(r.lote_id)
    porGhe.set(r.pgr_ghe_id, g)
  }

  const min = campanha.min_respondentes ?? 5
  let geradas = 0
  try {
    for (const [gheId, g] of Array.from(porGhe.entries())) {
      if (g.lotes.size < min) {
        // Abaixo do mínimo: suprime (remove síntese anterior, se houver).
        await admin.from("psi_sintese_qualitativa").delete().eq("campanha_id", id).eq("pgr_ghe_id", gheId)
        continue
      }
      const sintese = await sintetizarQualitativo({ perguntas, respostas: g.respostas })
      const { error } = await admin.from("psi_sintese_qualitativa").upsert(
        {
          empresa_id: campanha.empresa_id,
          campanha_id: id,
          pgr_ghe_id: gheId,
          temas: sintese.temas,
          alertas: sintese.alertas_identificacao,
          sugestoes: sintese.sugestoes_acao,
          verbatim_aprovado: [],
          revisado: false,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "campanha_id,pgr_ghe_id" },
      )
      if (error) return { error: error.message }
      geradas++
    }
  } catch (e) {
    if (e instanceof IAServiceUnavailable) return { error: "IA indisponível (ANTHROPIC_API_KEY não configurada)." }
    return { error: e instanceof Error ? e.message : "Falha na síntese por IA." }
  }

  if (geradas === 0) {
    return { error: `Nenhum GHE atingiu o mínimo de ${min} respondentes (anonimato preservado).` }
  }
  revalidatePath(`/psicossocial/${id}`)
  return { ok: true, id: `${geradas}` }
}

/** Marca a síntese de um GHE como revisada e fixa os trechos verbatim aprovados. */
export async function revisarSinteseQualitativa(
  sinteseId: string,
  campanhaId: string,
  verbatimAprovado: string[],
): Promise<ActionResult> {
  try {
    await requireRole(ROLES)
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Não autorizado" }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from("psi_sintese_qualitativa")
    .update({
      verbatim_aprovado: verbatimAprovado,
      revisado: true,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", sinteseId)
  if (error) return { error: error.message }
  revalidatePath(`/psicossocial/${campanhaId}`)
  return { ok: true }
}

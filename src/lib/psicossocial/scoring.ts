/**
 * Motor de cálculo psicossocial (COPSOQ) — funções puras, testáveis.
 *
 * Convenção: resposta de cada item em escala 0..100 (Likert convertido).
 *  - item.reverso = true  → resposta alta significa MENOR risco (dimensões
 *    positivas: apoio, autonomia, reconhecimento).
 *  - item.reverso = false → resposta alta significa MAIOR risco.
 * Logo, "risco do item" = reverso ? (100 - valor) : valor.
 *
 * Score da dimensão (por respondente) = média dos itens válidos.
 * Agregação por GHE = média dos respondentes, suprimida se n < mínimo
 * (anonimato/LGPD). Classificação por tercis (verde/amarelo/vermelho).
 */

export type Classificacao = "verde" | "amarelo" | "vermelho"
export type RiscoDirecao = "direto" | "inverso"

export const FAIXAS = {
  verde: { min: 0, max: 33.3, rotulo: "Risco baixo" },
  amarelo: { min: 33.4, max: 66.6, rotulo: "Risco médio" },
  vermelho: { min: 66.7, max: 100, rotulo: "Risco alto" },
} as const

/**
 * Faixas de corte (em score de RISCO 0-100) que definem verde/amarelo/vermelho.
 * Dirigidas pelo instrumento: o COPSOQ usa tercis; HSE-IT e PROART têm pontos de
 * corte próprios. `verdeMax` = limite superior do verde; `amareloMax` = limite
 * superior do amarelo; acima disso é vermelho.
 */
export type FaixaDef = { verdeMax: number; amareloMax: number }

/** Tercis (padrão COPSOQ): 0-33.3 verde, 33.4-66.6 amarelo, 66.7-100 vermelho. */
export const FAIXAS_TERCIS: FaixaDef = { verdeMax: FAIXAS.verde.max, amareloMax: FAIXAS.amarelo.max }

export type ItemDef = { id: string; texto?: string; reverso?: boolean; versoes?: string[] }
/**
 * tipo: "exposicao" = fator de risco (alimenta o Inventário do PGR);
 *       "desfecho"  = consequência (sofrimento/danos/burnout) — só monitoramento,
 *                     NÃO é lançado no PGR. Ausente → "exposicao".
 */
export type TipoDimensao = "exposicao" | "desfecho"
/** Subescala do DASS-21 (define a tabela de cortes de severidade). */
export type DassSubescala = "depressao" | "ansiedade" | "estresse"

export type DimensaoDef = {
  id: string
  nome: string
  risco_direcao: RiscoDirecao
  tipo?: TipoDimensao
  /** Para instrumentos método "dass21": a qual subescala a dimensão pertence. */
  dassSubescala?: DassSubescala
  versoes?: string[]
  itens: ItemDef[]
}
export type DominioDef = { id: string; nome: string; dimensoes: DimensaoDef[] }

/**
 * Método de pontuação do instrumento:
 *  - "media"  (padrão): média 0-100 por dimensão → tercil verde/amarelo/vermelho
 *    (COPSOQ, HSE, PROART, CBI).
 *  - "dass21": soma dos itens (0-3) × 2 por subescala (0-42) → nível em 5 faixas
 *    específicas por subescala (DASS-21), mapeadas para a cor verde/amarelo/vermelho.
 */
export type MetodoScore = "media" | "dass21"

export type InstrumentoDef = {
  dominios: DominioDef[]
  /** Pontos de corte da classificação (método "media"). Ausente → tercis. */
  faixas?: FaixaDef
  /** Método de pontuação. Ausente → "media". */
  metodo?: MetodoScore
}

export type Respondente = Record<string, number | null | undefined>

export type AggResult = {
  score: number | null
  classificacao: Classificacao | null
  n: number
  suprimido: boolean
}

export type ResultadoDimensao = AggResult & {
  dominio: string
  dimensao_id: string
  dimensao: string
  risco_direcao: RiscoDirecao
  tipo: TipoDimensao
  /** Rótulo de severidade nativo do instrumento (ex.: DASS: normal..extremamente_severo). */
  nivel_desfecho?: string | null
}

/** Item achatado para render do formulário (independe do instrumento). */
export type ItemFlat = { id: string; dominio: string; dimensao: string; texto: string; reverso: boolean }

/**
 * Achata um instrumento numa lista de itens para uma versão (para render do
 * formulário). Genérico — serve a qualquer InstrumentoDef (COPSOQ, HSE, ...).
 */
export function flattenItens(def: InstrumentoDef, versao: string): ItemFlat[] {
  const out: ItemFlat[] = []
  for (const dom of def.dominios) {
    for (const dim of dom.dimensoes) {
      if (dim.versoes && !dim.versoes.includes(versao)) continue
      for (const it of dim.itens) {
        if (it.versoes && !it.versoes.includes(versao)) continue
        out.push({
          id: it.id,
          dominio: dom.nome,
          dimensao: dim.nome,
          texto: it.texto ?? it.id,
          reverso: !!it.reverso,
        })
      }
    }
  }
  return out
}

/** Converte a resposta de um item em contribuição de risco (0-100). */
export function riscoDoItem(valor: number | null | undefined, reverso: boolean): number | null {
  if (valor == null || Number.isNaN(Number(valor))) return null
  const v = Math.max(0, Math.min(100, Number(valor)))
  return reverso ? 100 - v : v
}

/** Score de risco de uma dimensão para UM respondente (média dos itens válidos). */
export function scoreDimensaoRespondente(
  itensDef: ItemDef[],
  respostas: Respondente,
): number | null {
  const contrib: number[] = []
  for (const item of itensDef) {
    const r = riscoDoItem(respostas[item.id], !!item.reverso)
    if (r !== null) contrib.push(r)
  }
  if (contrib.length === 0) return null
  return contrib.reduce((a, b) => a + b, 0) / contrib.length
}

/**
 * Classifica um score de risco (0-100) em verde/amarelo/vermelho.
 * As faixas de corte são dirigidas pelo instrumento (padrão: tercis COPSOQ).
 */
export function classificar(score: number | null, faixas: FaixaDef = FAIXAS_TERCIS): Classificacao | null {
  if (score == null || Number.isNaN(score)) return null
  if (score <= faixas.verdeMax) return "verde"
  if (score <= faixas.amareloMax) return "amarelo"
  return "vermelho"
}

/**
 * Agrega um GHE para uma dimensão. Aplica o mínimo de respondentes para
 * proteger o anonimato — abaixo do mínimo, o resultado é suprimido.
 */
export function agregarDimensaoGHE(
  itensDef: ItemDef[],
  respondentes: Respondente[],
  minRespondentes = 5,
  faixas: FaixaDef = FAIXAS_TERCIS,
): AggResult {
  const scores = respondentes
    .map((resp) => scoreDimensaoRespondente(itensDef, resp))
    .filter((s): s is number => s !== null)

  const n = scores.length
  if (n < minRespondentes) {
    return { score: null, classificacao: null, n, suprimido: true }
  }
  const score = scores.reduce((a, b) => a + b, 0) / n
  return {
    score: Math.round(score * 100) / 100,
    classificacao: classificar(score, faixas),
    n,
    suprimido: false,
  }
}

/**
 * Processa todas as dimensões aplicáveis a uma versão (curto/medio) para um GHE.
 * Usa as faixas de corte do próprio instrumento (tercis se não definidas).
 */
export function processarGHE(
  instrumento: InstrumentoDef,
  respondentes: Respondente[],
  versao = "curto",
  minRespondentes = 5,
): ResultadoDimensao[] {
  const faixas = instrumento.faixas ?? FAIXAS_TERCIS
  const out: ResultadoDimensao[] = []
  for (const dom of instrumento.dominios) {
    for (const dim of dom.dimensoes) {
      const incluiNaVersao = !dim.versoes || dim.versoes.includes(versao)
      if (!incluiNaVersao) continue
      const itensDef = dim.itens.filter((it) => !it.versoes || it.versoes.includes(versao))
      if (itensDef.length === 0) continue
      out.push({
        dominio: dom.nome,
        dimensao_id: dim.id,
        dimensao: dim.nome,
        risco_direcao: dim.risco_direcao,
        tipo: dim.tipo ?? "exposicao",
        ...agregarDimensaoGHE(itensDef, respondentes, minRespondentes, faixas),
      })
    }
  }
  return out
}

/**
 * Mapeia a classificação por tercil para a `categoria_risco` do Inventário do
 * PGR (pgr_risco). O PGR usa 5 níveis; o psicossocial por tercil mapeia em 3.
 */
export function classificacaoParaCategoriaRiscoPGR(
  c: Classificacao,
): "baixo" | "medio" | "alto" {
  return c === "vermelho" ? "alto" : c === "amarelo" ? "medio" : "baixo"
}

// ============================================================================
// Camada NR-1 — Nível de Risco Ocupacional (Probabilidade × Severidade × Exposição)
// ============================================================================
//
// A NR-1 (Guia MTE de Fatores Psicossociais) exige que o nível de risco seja
// determinado por uma matriz Probabilidade × Severidade — opcionalmente com um
// terceiro eixo de Exposição — e NÃO pelo score do questionário isoladamente
// ("o uso isolado de questionário não é suficiente"). Aqui:
//   - PROBABILIDADE (1-5) é derivada do score de risco do questionário (0-100);
//   - SEVERIDADE (1-5) e EXPOSIÇÃO (1-5) vêm da avaliação técnica do responsável.
// Produto P×S (1-25) ou P×S×E (1-125) → nível em 4 categorias.

export type NivelNR1 = "baixo" | "medio" | "alto" | "critico"
export type CategoriaRiscoPGR = "muito_baixo" | "baixo" | "medio" | "alto" | "muito_alto"

export type ResultadoNR1 = {
  probabilidade: number // 1-5
  severidade: number // 1-5
  exposicao: number | null // 1-5 ou null (matriz P×S)
  produto: number // P×S (1-25) ou P×S×E (1-125)
  nivel: NivelNR1
}

/** Converte o score de risco do questionário (0-100) na Probabilidade NR-1 (1-5). */
export function probabilidadeDoScore(score: number | null): number {
  if (score == null || Number.isNaN(score)) return 1
  const s = Math.max(0, Math.min(100, score))
  if (s <= 20) return 1
  if (s <= 40) return 2
  if (s <= 60) return 3
  if (s <= 80) return 4
  return 5
}

/**
 * Determina o nível de risco NR-1 a partir de Probabilidade, Severidade e,
 * opcionalmente, Exposição (todos 1-5). Bandas conforme exemplo do Guia MTE:
 *   - P×S×E (1-125): baixo 1-11, médio 12-35, alto 36-74, crítico 75-125.
 *   - P×S   (1-25):  baixo 1-4,  médio 5-9,   alto 10-15, crítico 16-25.
 */
export function nivelRiscoNR1(
  probabilidade: number,
  severidade: number,
  exposicao?: number | null,
): ResultadoNR1 {
  const p = Math.max(1, Math.min(5, Math.round(probabilidade)))
  const s = Math.max(1, Math.min(5, Math.round(severidade)))
  const e = exposicao == null ? null : Math.max(1, Math.min(5, Math.round(exposicao)))

  let produto: number
  let nivel: NivelNR1
  if (e == null) {
    produto = p * s
    nivel = produto <= 4 ? "baixo" : produto <= 9 ? "medio" : produto <= 15 ? "alto" : "critico"
  } else {
    produto = p * s * e
    nivel = produto <= 11 ? "baixo" : produto <= 35 ? "medio" : produto <= 74 ? "alto" : "critico"
  }
  return { probabilidade: p, severidade: s, exposicao: e, produto, nivel }
}

/** Mapeia o nível NR-1 (4 categorias) para a `categoria_risco` do PGR (5 níveis). */
export function nivelNR1ParaCategoriaRiscoPGR(nivel: NivelNR1): CategoriaRiscoPGR {
  switch (nivel) {
    case "baixo":
      return "baixo"
    case "medio":
      return "medio"
    case "alto":
      return "alto"
    case "critico":
      return "muito_alto"
  }
}

// ============================================================================
// Scoring DASS-21 — soma dos itens (0-3) × 2 por subescala (0-42) → 5 níveis
// ============================================================================
//
// Diferente do método "media": cada respondente soma os 7 itens (0-3) de uma
// subescala e multiplica por 2 (equipara ao DASS-42). A severidade tem cortes
// PRÓPRIOS por subescala. No nível do GHE, agregamos pela MÉDIA das pontuações
// individuais da subescala e classificamos pela mesma tabela.

export type NivelDass = "normal" | "leve" | "moderado" | "severo" | "extremamente_severo"

/** Cortes de severidade do DASS-21 por subescala (limite superior de cada nível). */
export const DASS_CORTES: Record<DassSubescala, { ate: number; nivel: NivelDass }[]> = {
  depressao: [
    { ate: 9, nivel: "normal" }, { ate: 13, nivel: "leve" }, { ate: 20, nivel: "moderado" },
    { ate: 27, nivel: "severo" }, { ate: Infinity, nivel: "extremamente_severo" },
  ],
  ansiedade: [
    { ate: 7, nivel: "normal" }, { ate: 9, nivel: "leve" }, { ate: 14, nivel: "moderado" },
    { ate: 19, nivel: "severo" }, { ate: Infinity, nivel: "extremamente_severo" },
  ],
  estresse: [
    { ate: 14, nivel: "normal" }, { ate: 18, nivel: "leve" }, { ate: 25, nivel: "moderado" },
    { ate: 33, nivel: "severo" }, { ate: Infinity, nivel: "extremamente_severo" },
  ],
}

/** Classifica a pontuação (0-42) de uma subescala do DASS-21 no nível de severidade. */
export function nivelDass(subescala: DassSubescala, pontuacao: number): NivelDass {
  for (const faixa of DASS_CORTES[subescala]) {
    if (pontuacao <= faixa.ate) return faixa.nivel
  }
  return "extremamente_severo"
}

/** Mapeia o nível DASS (5) para a cor de classificação (verde/amarelo/vermelho). */
export function nivelDassParaClassificacao(n: NivelDass): Classificacao {
  if (n === "normal" || n === "leve") return "verde"
  if (n === "moderado") return "amarelo"
  return "vermelho"
}

/**
 * Processa um GHE pelo método DASS-21. Para cada subescala (dimensão): soma os
 * itens (0-3) × 2 por respondente; agrega pela média (suprime se n < mínimo);
 * classifica pela tabela de cortes da subescala. `score` fica em 0-42.
 */
export function processarGHEDass(
  instrumento: InstrumentoDef,
  respondentes: Respondente[],
  minRespondentes = 5,
): ResultadoDimensao[] {
  const out: ResultadoDimensao[] = []
  for (const dom of instrumento.dominios) {
    for (const dim of dom.dimensoes) {
      const sub = dim.dassSubescala
      // Pontuação individual = soma dos itens (0-3) × 2, só p/ quem respondeu todos.
      const pontuacoes: number[] = []
      for (const resp of respondentes) {
        let soma = 0
        let completos = 0
        for (const it of dim.itens) {
          const v = resp[it.id]
          if (v == null || Number.isNaN(Number(v))) continue
          soma += Math.max(0, Math.min(3, Number(v)))
          completos++
        }
        if (completos === dim.itens.length) pontuacoes.push(soma * 2)
      }
      const n = pontuacoes.length
      const base = {
        dominio: dom.nome,
        dimensao_id: dim.id,
        dimensao: dim.nome,
        risco_direcao: dim.risco_direcao,
        tipo: dim.tipo ?? "desfecho",
      }
      if (n < minRespondentes || !sub) {
        out.push({ ...base, score: null, classificacao: null, n, suprimido: true, nivel_desfecho: null })
        continue
      }
      const media = pontuacoes.reduce((a, b) => a + b, 0) / n
      const score = Math.round(media * 100) / 100
      const nd = nivelDass(sub, score)
      out.push({
        ...base,
        score,
        classificacao: nivelDassParaClassificacao(nd),
        n,
        suprimido: false,
        nivel_desfecho: nd,
      })
    }
  }
  return out
}

/** Dispatcher: processa um GHE conforme o método do instrumento ("media" | "dass21"). */
export function processarInstrumento(
  instrumento: InstrumentoDef,
  respondentes: Respondente[],
  versao = "unica",
  minRespondentes = 5,
): ResultadoDimensao[] {
  if (instrumento.metodo === "dass21") {
    return processarGHEDass(instrumento, respondentes, minRespondentes)
  }
  return processarGHE(instrumento, respondentes, versao, minRespondentes)
}

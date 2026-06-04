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

export type ItemDef = { id: string; texto?: string; reverso?: boolean; versoes?: string[] }
export type DimensaoDef = {
  id: string
  nome: string
  risco_direcao: RiscoDirecao
  versoes?: string[]
  itens: ItemDef[]
}
export type DominioDef = { id: string; nome: string; dimensoes: DimensaoDef[] }
export type InstrumentoDef = { dominios: DominioDef[] }

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

/** Classifica um score de risco (0-100) em verde/amarelo/vermelho. */
export function classificar(score: number | null): Classificacao | null {
  if (score == null || Number.isNaN(score)) return null
  if (score <= FAIXAS.verde.max) return "verde"
  if (score <= FAIXAS.amarelo.max) return "amarelo"
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
    classificacao: classificar(score),
    n,
    suprimido: false,
  }
}

/**
 * Processa todas as dimensões aplicáveis a uma versão (curto/medio) para um GHE.
 */
export function processarGHE(
  instrumento: InstrumentoDef,
  respondentes: Respondente[],
  versao = "curto",
  minRespondentes = 5,
): ResultadoDimensao[] {
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
        ...agregarDimensaoGHE(itensDef, respondentes, minRespondentes),
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

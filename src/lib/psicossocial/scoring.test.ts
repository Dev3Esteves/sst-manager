import { describe, it, expect } from "vitest"
import {
  riscoDoItem,
  classificar,
  agregarDimensaoGHE,
  processarGHE,
  classificacaoParaCategoriaRiscoPGR,
  probabilidadeDoScore,
  nivelRiscoNR1,
  nivelNR1ParaCategoriaRiscoPGR,
  FAIXAS_TERCIS,
  percentil,
  distribuicaoRiscoPorDimensao,
  calibrarFaixasPercentil,
  aplicarFaixasPorDimensao,
  type ItemDef,
  type FaixaDef,
  type InstrumentoDef,
  type Respondente,
} from "./scoring"
import { COPSOQ_BR, itensDaVersao } from "./copsoq"

describe("riscoDoItem", () => {
  it("item direto: alto = alto risco", () => expect(riscoDoItem(100, false)).toBe(100))
  it("item reverso: alto = baixo risco", () => expect(riscoDoItem(100, true)).toBe(0))
  it("item reverso: baixo apoio = alto risco", () => expect(riscoDoItem(0, true)).toBe(100))
  it("clampa fora de 0-100", () => expect(riscoDoItem(150, false)).toBe(100))
  it("null/NaN retorna null", () => {
    expect(riscoDoItem(null, false)).toBeNull()
    expect(riscoDoItem(undefined, false)).toBeNull()
  })
})

describe("classificar (tercis)", () => {
  it("0 -> verde", () => expect(classificar(0)).toBe("verde"))
  it("33.3 -> verde (limite)", () => expect(classificar(33.3)).toBe("verde"))
  it("50 -> amarelo", () => expect(classificar(50)).toBe("amarelo"))
  it("80 -> vermelho", () => expect(classificar(80)).toBe("vermelho"))
  it("null -> null", () => expect(classificar(null)).toBeNull())
  it("usa tercis por padrão", () => expect(FAIXAS_TERCIS).toEqual({ verdeMax: 33.3, amareloMax: 66.6 }))
})

describe("classificar com faixas dirigidas pelo instrumento", () => {
  // Faixas próprias (ex.: instrumento mais sensível): verde só até 20, vermelho a partir de 50.
  const faixas: FaixaDef = { verdeMax: 20, amareloMax: 50 }
  it("30 é amarelo com faixas próprias (seria verde no tercil)", () => {
    expect(classificar(30)).toBe("verde")
    expect(classificar(30, faixas)).toBe("amarelo")
  })
  it("60 é vermelho com faixas próprias (seria amarelo no tercil)", () => {
    expect(classificar(60)).toBe("amarelo")
    expect(classificar(60, faixas)).toBe("vermelho")
  })
  it("processarGHE respeita instrumento.faixas", () => {
    // Instrumento com 1 dimensão direta e faixas sensíveis; resposta uniforme 30.
    const inst = {
      faixas,
      dominios: [
        {
          id: "d", nome: "D",
          dimensoes: [{ id: "x", nome: "X", risco_direcao: "direto" as const, itens: [{ id: "I1", reverso: false }] }],
        },
      ],
    }
    const resp = Array.from({ length: 5 }, () => ({ I1: 30 }))
    const [r] = processarGHE(inst, resp, "curto", 5)
    expect(r.score).toBe(30)
    expect(r.classificacao).toBe("amarelo") // verdeMax=20 → 30 cai no amarelo
  })
})

describe("agregarDimensaoGHE", () => {
  const itensDiretos: ItemDef[] = [{ id: "A", reverso: false }, { id: "B", reverso: false }]

  it("suprime GHE abaixo do mínimo", () => {
    const r = agregarDimensaoGHE(itensDiretos, [{ A: 100, B: 100 }], 5)
    expect(r.suprimido).toBe(true)
    expect(r.score).toBeNull()
    expect(r.classificacao).toBeNull()
  })

  it("calcula score quando atinge o mínimo", () => {
    const resp: Respondente[] = [
      { A: 100, B: 100 }, { A: 50, B: 50 }, { A: 0, B: 0 },
      { A: 75, B: 25 }, { A: 50, B: 50 },
    ]
    const r = agregarDimensaoGHE(itensDiretos, resp, 5)
    expect(r.suprimido).toBe(false)
    expect(r.n).toBe(5)
    // médias por respondente: 100, 50, 0, 50, 50 -> média 50
    expect(r.score).toBe(50)
    expect(r.classificacao).toBe("amarelo")
  })
})

/** Respondente que marca o mesmo valor em todos os itens de uma versão. */
function respondenteUniforme(valor: number, versao: "curto" | "medio"): Respondente {
  const r: Respondente = {}
  for (const it of itensDaVersao(versao)) r[it.id] = valor
  return r
}

describe("processarGHE com COPSOQ_BR (versão curta oficial)", () => {
  it("retorna as 8 dimensões de exposição da versão curta", () => {
    const resp = Array.from({ length: 5 }, () => respondenteUniforme(50, "curto"))
    const res = processarGHE(COPSOQ_BR, resp, "curto", 5)
    expect(res.length).toBe(8)
    // ponto médio (50) classifica todas como amarelo (direto e reverso dão 50)
    expect(res.every((d) => d.score === 50 && d.classificacao === "amarelo")).toBe(true)
  })

  it("respeita a direção de risco (reverso vs direto)", () => {
    // Todos respondem 0: dimensão reversa (recurso ausente) = risco máximo;
    // dimensão direta (demanda/ofensa ausente) = risco mínimo.
    const resp = Array.from({ length: 5 }, () => respondenteUniforme(0, "curto"))
    const res = processarGHE(COPSOQ_BR, resp, "curto", 5)
    const influencia = res.find((d) => d.dimensao_id === "influencia_desenvolvimento")!
    expect(influencia.score).toBe(100)
    expect(influencia.classificacao).toBe("vermelho")
    const ofensivos = res.find((d) => d.dimensao_id === "comportamentos_ofensivos")!
    expect(ofensivos.score).toBe(0)
    expect(ofensivos.classificacao).toBe("verde")
  })

  it("suprime quando há menos respondentes que o mínimo", () => {
    const resp = Array.from({ length: 4 }, () => respondenteUniforme(50, "curto"))
    const res = processarGHE(COPSOQ_BR, resp, "curto", 5)
    expect(res.every((d) => d.suprimido && d.score === null)).toBe(true)
  })
})

describe("classificacaoParaCategoriaRiscoPGR", () => {
  it("mapeia tercil -> categoria do PGR", () => {
    expect(classificacaoParaCategoriaRiscoPGR("vermelho")).toBe("alto")
    expect(classificacaoParaCategoriaRiscoPGR("amarelo")).toBe("medio")
    expect(classificacaoParaCategoriaRiscoPGR("verde")).toBe("baixo")
  })
})

describe("NR-1: probabilidadeDoScore (score 0-100 -> 1-5)", () => {
  it("mapeia faixas de score para probabilidade", () => {
    expect(probabilidadeDoScore(0)).toBe(1)
    expect(probabilidadeDoScore(20)).toBe(1)
    expect(probabilidadeDoScore(40)).toBe(2)
    expect(probabilidadeDoScore(60)).toBe(3)
    expect(probabilidadeDoScore(80)).toBe(4)
    expect(probabilidadeDoScore(100)).toBe(5)
  })
  it("null/NaN -> probabilidade mínima (1)", () => {
    expect(probabilidadeDoScore(null)).toBe(1)
  })
})

describe("NR-1: nivelRiscoNR1", () => {
  it("matriz P×S (1-25) classifica em 4 níveis", () => {
    expect(nivelRiscoNR1(1, 1).nivel).toBe("baixo") // 1
    expect(nivelRiscoNR1(2, 3).nivel).toBe("medio") // 6
    expect(nivelRiscoNR1(3, 4).nivel).toBe("alto") // 12
    expect(nivelRiscoNR1(5, 5).nivel).toBe("critico") // 25
    expect(nivelRiscoNR1(2, 3).produto).toBe(6)
    expect(nivelRiscoNR1(2, 3).exposicao).toBeNull()
  })
  it("matriz P×S×E (1-125) usa bandas do Guia MTE", () => {
    expect(nivelRiscoNR1(1, 2, 3).nivel).toBe("baixo") // 6
    expect(nivelRiscoNR1(2, 3, 4).nivel).toBe("medio") // 24
    expect(nivelRiscoNR1(3, 4, 5).nivel).toBe("alto") // 60
    expect(nivelRiscoNR1(5, 5, 5).nivel).toBe("critico") // 125
    expect(nivelRiscoNR1(5, 5, 5).produto).toBe(125)
  })
  it("limita (clamp) entradas fora de 1-5", () => {
    const r = nivelRiscoNR1(9, 0, 7)
    expect(r.probabilidade).toBe(5)
    expect(r.severidade).toBe(1)
    expect(r.exposicao).toBe(5)
  })
})

describe("NR-1: nivelNR1ParaCategoriaRiscoPGR", () => {
  it("mapeia 4 níveis NR-1 para a categoria_risco do PGR (5 níveis)", () => {
    expect(nivelNR1ParaCategoriaRiscoPGR("baixo")).toBe("baixo")
    expect(nivelNR1ParaCategoriaRiscoPGR("medio")).toBe("medio")
    expect(nivelNR1ParaCategoriaRiscoPGR("alto")).toBe("alto")
    expect(nivelNR1ParaCategoriaRiscoPGR("critico")).toBe("muito_alto")
  })
})

describe("itensDaVersao", () => {
  it("a versão curta oficial tem 34 itens de exposição e curto ⊆ médio", () => {
    const curto = itensDaVersao("curto")
    const medio = itensDaVersao("medio")
    expect(curto.length).toBe(34)
    expect(medio.length).toBeGreaterThanOrEqual(curto.length)
    const idsMedio = new Set(medio.map((i) => i.id))
    for (const i of curto) expect(idsMedio.has(i.id)).toBe(true)
  })

  it("itens reversos vêm marcados (Q1B invertido; Q1A direto; Q4A recurso reverso)", () => {
    const curto = itensDaVersao("curto")
    expect(curto.find((i) => i.id === "Q1B")?.reverso).toBe(true)
    expect(curto.find((i) => i.id === "Q1A")?.reverso).toBe(false)
    expect(curto.find((i) => i.id === "Q4A")?.reverso).toBe(true)
  })
})

// ── Calibração por percentis ────────────────────────────────────────────────

describe("percentil (interpolação linear)", () => {
  const v = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] // 11 valores, P50 = 50
  it("P0/P100 = extremos", () => {
    expect(percentil(v, 0)).toBe(0)
    expect(percentil(v, 100)).toBe(100)
  })
  it("P50 = mediana", () => expect(percentil(v, 50)).toBe(50))
  it("P80 interpola", () => expect(percentil(v, 80)).toBeCloseTo(80, 5))
  it("vazio = NaN; único = o valor", () => {
    expect(Number.isNaN(percentil([], 50))).toBe(true)
    expect(percentil([42], 50)).toBe(42)
  })
})

describe("distribuicaoRiscoPorDimensao", () => {
  const inst: InstrumentoDef = {
    dominios: [
      {
        id: "d", nome: "D",
        dimensoes: [
          { id: "dir", nome: "Direta", risco_direcao: "direto", itens: [{ id: "A", reverso: false }] },
          { id: "inv", nome: "Inversa", risco_direcao: "inverso", itens: [{ id: "B", reverso: true }] },
        ],
      },
    ],
  }
  it("coleta um score de risco por respondente, por dimensão (respeita reverso)", () => {
    const resp: Respondente[] = [{ A: 20, B: 100 }, { A: 80, B: 0 }]
    const dist = distribuicaoRiscoPorDimensao(inst, resp, "unica")
    expect(dist.get("dir")).toEqual([20, 80])
    expect(dist.get("inv")).toEqual([0, 100]) // reverso: 100→0, 0→100
  })
  it("ignora itens sem resposta", () => {
    const dist = distribuicaoRiscoPorDimensao(inst, [{ A: null }, { A: 50 }], "unica")
    expect(dist.get("dir")).toEqual([50])
  })
})

describe("calibrarFaixasPercentil (P50/P80)", () => {
  it("deriva verdeMax=P50 e amareloMax=P80 quando há amostra suficiente", () => {
    const dist = new Map<string, number[]>([
      ["x", [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]],
    ])
    const cal = calibrarFaixasPercentil(dist, { pVerde: 50, pAmarelo: 80, minN: 5 })
    const f = cal.get("x")!
    expect(f.verdeMax).toBe(50)
    expect(f.amareloMax).toBeCloseTo(80, 5)
    expect(f.n).toBe(11)
  })
  it("OMITE dimensões abaixo do mínimo amostral", () => {
    const dist = new Map<string, number[]>([["x", [10, 20, 30]]])
    const cal = calibrarFaixasPercentil(dist, { pVerde: 50, pAmarelo: 80, minN: 30 })
    expect(cal.has("x")).toBe(false)
  })
  it("garante monotonicidade (amareloMax ≥ verdeMax)", () => {
    // Distribuição degenerada: todos iguais → P50 = P80 = 40.
    const dist = new Map<string, number[]>([["x", Array.from({ length: 10 }, () => 40)]])
    const f = calibrarFaixasPercentil(dist, { pVerde: 50, pAmarelo: 80, minN: 5 }).get("x")!
    expect(f.amareloMax).toBeGreaterThanOrEqual(f.verdeMax)
  })
})

describe("aplicarFaixasPorDimensao + processarGHE", () => {
  const inst: InstrumentoDef = {
    faixas: FAIXAS_TERCIS,
    dominios: [
      {
        id: "d", nome: "D",
        dimensoes: [
          { id: "x", nome: "X", risco_direcao: "direto", itens: [{ id: "I", reverso: false }] },
          { id: "y", nome: "Y", risco_direcao: "direto", itens: [{ id: "J", reverso: false }] },
        ],
      },
    ],
  }
  it("injeta faixa só na dimensão calibrada; original fica imutável", () => {
    const calMap = new Map<string, FaixaDef>([["x", { verdeMax: 20, amareloMax: 50 }]])
    const def2 = aplicarFaixasPorDimensao(inst, calMap)
    expect(def2.dominios[0].dimensoes[0].faixas).toEqual({ verdeMax: 20, amareloMax: 50 })
    expect(def2.dominios[0].dimensoes[1].faixas).toBeUndefined()
    expect(inst.dominios[0].dimensoes[0].faixas).toBeUndefined() // não mutou o original
  })
  it("score 30 → vermelho na dimensão calibrada (faixa própria) e verde na não-calibrada", () => {
    const calMap = new Map<string, FaixaDef>([["x", { verdeMax: 10, amareloMax: 25 }]])
    const def2 = aplicarFaixasPorDimensao(inst, calMap)
    const resp = Array.from({ length: 5 }, () => ({ I: 30, J: 30 }))
    const res = processarGHE(def2, resp, "unica", 5)
    expect(res.find((r) => r.dimensao_id === "x")?.classificacao).toBe("vermelho") // 30 > 25
    expect(res.find((r) => r.dimensao_id === "y")?.classificacao).toBe("verde") // tercil: 30 ≤ 33.3
  })
})

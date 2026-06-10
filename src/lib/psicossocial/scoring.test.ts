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
  type ItemDef,
  type FaixaDef,
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

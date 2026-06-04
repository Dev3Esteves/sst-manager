import { describe, it, expect } from "vitest"
import {
  riscoDoItem,
  classificar,
  agregarDimensaoGHE,
  processarGHE,
  classificacaoParaCategoriaRiscoPGR,
  type ItemDef,
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

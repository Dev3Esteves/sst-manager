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

describe("processarGHE com COPSOQ_BR", () => {
  it("processa a versão curta e respeita supressão + direção de risco", () => {
    const respondentes: Respondente[] = Array.from({ length: 6 }, () => ({
      DQ1: 100, RT1: 75, DE1: 50, IN1: 0, SG1: 25, RC1: 0, CP1: 100,
      QL1: 50, AC1: 25, IE1: 75, TV1: 100, JO1: 50, AM1: 0, AX1: 0,
    }))
    const res = processarGHE(COPSOQ_BR, respondentes, "curto", 5)
    expect(res.length).toBeGreaterThan(0)

    // apoio_colegas é reverso: resposta 25 -> risco 75 (alto)
    const apoio = res.find((d) => d.dimensao_id === "apoio_colegas")!
    expect(apoio.score).toBe(75)
    expect(apoio.classificacao).toBe("vermelho")

    // demandas quantitativas é direto: 100 -> risco 100
    const dq = res.find((d) => d.dimensao_id === "demandas_quantitativas")!
    expect(dq.score).toBe(100)

    // dimensão exclusiva da versão média não deve aparecer na curta
    expect(res.find((d) => d.dimensao_id === "demandas_cognitivas")).toBeUndefined()
  })

  it("a versão média tem mais dimensões que a curta", () => {
    const um: Respondente[] = Array.from({ length: 5 }, () => ({ DQ1: 50 }))
    const curto = processarGHE(COPSOQ_BR, um, "curto", 5)
    const medio = processarGHE(COPSOQ_BR, um, "medio", 5)
    expect(medio.length).toBeGreaterThan(curto.length)
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
  it("curto < médio e todos os itens curtos estão na média", () => {
    const curto = itensDaVersao("curto")
    const medio = itensDaVersao("medio")
    expect(curto.length).toBeGreaterThan(0)
    expect(medio.length).toBeGreaterThan(curto.length)
    const idsMedio = new Set(medio.map((i) => i.id))
    for (const i of curto) expect(idsMedio.has(i.id)).toBe(true)
  })

  it("itens reversos vêm marcados", () => {
    const curto = itensDaVersao("curto")
    expect(curto.find((i) => i.id === "AC1")?.reverso).toBe(true) // apoio colegas
    expect(curto.find((i) => i.id === "DQ1")?.reverso).toBe(false) // sobrecarga
  })
})

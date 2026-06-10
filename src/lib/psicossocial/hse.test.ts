import { describe, it, expect } from "vitest"
import { flattenItens, processarGHE, type Respondente } from "./scoring"
import { HSE_IT_BR, ESCALA_HSE } from "./hse"

const itens = flattenItens(HSE_IT_BR, "unica")

function respondentes(valor: number, n = 5): Respondente[] {
  const um: Respondente = {}
  for (const it of itens) um[it.id] = valor
  return Array.from({ length: n }, () => ({ ...um }))
}

describe("HSE-IT — estrutura", () => {
  it("tem 35 itens e 7 dimensões", () => {
    expect(itens.length).toBe(35)
    expect(HSE_IT_BR.dominios.length).toBe(7)
  })

  it("contagem de itens por dimensão (8/6/5/4/4/5/3)", () => {
    const porDim = new Map<string, number>()
    for (const it of itens) porDim.set(it.dimensao, (porDim.get(it.dimensao) ?? 0) + 1)
    expect(porDim.get("Demandas")).toBe(8)
    expect(porDim.get("Controle")).toBe(6)
    expect(porDim.get("Apoio da Gestão")).toBe(5)
    expect(porDim.get("Apoio dos Colegas")).toBe(4)
    expect(porDim.get("Relacionamentos")).toBe(4)
    expect(porDim.get("Função/Papel")).toBe(5)
    expect(porDim.get("Mudança")).toBe(3)
  })

  it("escala é de 5 pontos convertida para 0-100", () => {
    expect(ESCALA_HSE.rotulos.length).toBe(5)
    expect([...ESCALA_HSE.valores]).toEqual([0, 25, 50, 75, 100])
  })

  it("direção por item: positivos reverso=true; negativos reverso=false", () => {
    expect(itens.find((i) => i.id === "H1")?.reverso).toBe(true) // clareza de papel (positivo)
    expect(itens.find((i) => i.id === "H6")?.reverso).toBe(false) // prazos impossíveis (negativo)
    expect(itens.find((i) => i.id === "H21")?.reverso).toBe(false) // bullying (negativo)
    expect(itens.find((i) => i.id === "H2")?.reverso).toBe(true) // controle de pausa (positivo)
  })
})

describe("HSE-IT — scoring respeita a direção de risco", () => {
  it("responder sempre 'Sempre' (100): demanda = risco alto; controle = risco baixo", () => {
    const res = processarGHE(HSE_IT_BR, respondentes(100), "unica", 5)
    expect(res.length).toBe(7)
    const demandas = res.find((d) => d.dimensao_id === "demandas")!
    expect(demandas.score).toBe(100)
    expect(demandas.classificacao).toBe("vermelho")
    const controle = res.find((d) => d.dimensao_id === "controle")!
    expect(controle.score).toBe(0)
    expect(controle.classificacao).toBe("verde")
  })

  it("suprime dimensões com menos respondentes que o mínimo", () => {
    const res = processarGHE(HSE_IT_BR, respondentes(50, 4), "unica", 5)
    expect(res.every((d) => d.suprimido && d.score === null)).toBe(true)
  })
})

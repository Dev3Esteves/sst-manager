import { describe, it, expect } from "vitest"
import { flattenItens, processarGHE, type Respondente } from "./scoring"
import { PROART_BR, ESCALA_PROART } from "./proart"

const itens = flattenItens(PROART_BR, "unica")

function respondentes(valor: number, n = 5): Respondente[] {
  const um: Respondente = {}
  for (const it of itens) um[it.id] = valor
  return Array.from({ length: n }, () => ({ ...um }))
}

describe("PROART — estrutura", () => {
  it("tem 91 itens, 4 escalas e 10 fatores", () => {
    expect(itens.length).toBe(91)
    expect(PROART_BR.dominios.length).toBe(4)
    const fatores = PROART_BR.dominios.flatMap((d) => d.dimensoes)
    expect(fatores.length).toBe(10)
  })

  it("contagem de itens por fator soma 91 (19+21+28+23)", () => {
    const porDim = new Map<string, number>()
    for (const it of itens) porDim.set(it.dimensao, (porDim.get(it.dimensao) ?? 0) + 1)
    expect(porDim.get("Divisão das Tarefas")).toBe(7)
    expect(porDim.get("Divisão Social do Trabalho")).toBe(12)
    expect(porDim.get("Estilo Individualista")).toBe(10)
    expect(porDim.get("Estilo Coletivista")).toBe(11)
    expect(porDim.get("Falta de Sentido do Trabalho")).toBe(9)
    expect(porDim.get("Esgotamento Mental")).toBe(8)
    expect(porDim.get("Falta de Reconhecimento")).toBe(11)
    expect(porDim.get("Danos Psicológicos")).toBe(7)
    expect(porDim.get("Danos Sociais")).toBe(7)
    expect(porDim.get("Danos Físicos")).toBe(9)
  })

  it("escala 5 pontos convertida para 0-100", () => {
    expect([...ESCALA_PROART.valores]).toEqual([0, 25, 50, 75, 100])
  })
})

describe("PROART — direção de risco por escala", () => {
  it("respondendo sempre 'Sempre' (100): escala positiva = risco baixo; negativa = risco alto", () => {
    const res = processarGHE(PROART_BR, respondentes(100), "unica", 5)
    expect(res.length).toBe(10)
    // Organização do Trabalho (positiva, reverso=true) → risco baixo
    const tarefas = res.find((d) => d.dimensao_id === "divisao_tarefas")!
    expect(tarefas.score).toBe(0)
    expect(tarefas.classificacao).toBe("verde")
    // Estilo Individualista (negativa, reverso=false) → risco alto
    const individualista = res.find((d) => d.dimensao_id === "estilo_individualista")!
    expect(individualista.score).toBe(100)
    expect(individualista.classificacao).toBe("vermelho")
    // Estilo Coletivista (positiva) → risco baixo
    expect(res.find((d) => d.dimensao_id === "estilo_coletivista")!.classificacao).toBe("verde")
  })
})

describe("PROART — tipo (exposição vs. desfecho)", () => {
  it("Sofrimento e Danos são desfecho; Organização e Estilos são exposição", () => {
    const res = processarGHE(PROART_BR, respondentes(50), "unica", 5)
    const tipoDe = (id: string) => res.find((d) => d.dimensao_id === id)!.tipo
    expect(tipoDe("divisao_tarefas")).toBe("exposicao")
    expect(tipoDe("estilo_individualista")).toBe("exposicao")
    expect(tipoDe("estilo_coletivista")).toBe("exposicao")
    expect(tipoDe("falta_sentido")).toBe("desfecho")
    expect(tipoDe("esgotamento_mental")).toBe("desfecho")
    expect(tipoDe("falta_reconhecimento")).toBe("desfecho")
    expect(tipoDe("danos_psicologicos")).toBe("desfecho")
    expect(tipoDe("danos_sociais")).toBe("desfecho")
    expect(tipoDe("danos_fisicos")).toBe("desfecho")
  })
})

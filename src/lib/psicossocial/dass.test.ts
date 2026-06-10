import { describe, it, expect } from "vitest"
import { flattenItens, processarInstrumento, nivelDass, type Respondente } from "./scoring"
import { DASS21_BR } from "./dass"

const itens = flattenItens(DASS21_BR, "unica")

/** Respondente que marca o mesmo valor (0-3) em todos os itens. */
function respondentes(valor: number, n = 5): Respondente[] {
  const um: Respondente = {}
  for (const it of itens) um[it.id] = valor
  return Array.from({ length: n }, () => ({ ...um }))
}

describe("DASS-21 — estrutura", () => {
  it("tem 21 itens e 3 subescalas de 7 itens", () => {
    expect(itens.length).toBe(21)
    const dims = DASS21_BR.dominios[0].dimensoes
    expect(dims.length).toBe(3)
    expect(dims.every((d) => d.itens.length === 7)).toBe(true)
  })
})

describe("DASS-21 — classificação por subescala (cortes nativos)", () => {
  it("nivelDass aplica os cortes corretos por subescala", () => {
    expect(nivelDass("depressao", 9)).toBe("normal")
    expect(nivelDass("depressao", 14)).toBe("moderado")
    expect(nivelDass("depressao", 28)).toBe("extremamente_severo")
    expect(nivelDass("ansiedade", 7)).toBe("normal")
    expect(nivelDass("ansiedade", 20)).toBe("extremamente_severo")
    expect(nivelDass("estresse", 14)).toBe("normal")
    expect(nivelDass("estresse", 26)).toBe("severo")
  })
})

describe("DASS-21 — scoring nativo (soma × 2)", () => {
  it("todos respondem 1 → soma 7×1×2 = 14 por subescala", () => {
    const res = processarInstrumento(DASS21_BR, respondentes(1), "unica", 5)
    const dep = res.find((d) => d.dimensao_id === "depressao")!
    expect(dep.score).toBe(14) // 7 itens × 1 × 2
    expect(dep.nivel_desfecho).toBe("moderado") // depressão: 14 = moderado
    expect(dep.classificacao).toBe("amarelo")
    expect(dep.tipo).toBe("desfecho")
    const ans = res.find((d) => d.dimensao_id === "ansiedade")!
    expect(ans.score).toBe(14)
    expect(ans.nivel_desfecho).toBe("moderado") // ansiedade: 14 = moderado (10-14)
  })

  it("todos respondem 3 → soma máxima 42 = extremamente severo (vermelho)", () => {
    const res = processarInstrumento(DASS21_BR, respondentes(3), "unica", 5)
    const est = res.find((d) => d.dimensao_id === "estresse")!
    expect(est.score).toBe(42)
    expect(est.nivel_desfecho).toBe("extremamente_severo")
    expect(est.classificacao).toBe("vermelho")
  })

  it("suprime abaixo do mínimo de respondentes", () => {
    const res = processarInstrumento(DASS21_BR, respondentes(2, 4), "unica", 5)
    expect(res.every((d) => d.suprimido && d.score === null)).toBe(true)
  })
})

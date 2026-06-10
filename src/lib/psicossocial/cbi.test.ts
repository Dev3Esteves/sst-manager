import { describe, it, expect } from "vitest"
import { flattenItens, processarInstrumento, type Respondente } from "./scoring"
import { CBI_BR } from "./cbi"

const itens = flattenItens(CBI_BR, "unica")

function respondentes(valor: number, n = 5): Respondente[] {
  const um: Respondente = {}
  for (const it of itens) um[it.id] = valor
  return Array.from({ length: n }, () => ({ ...um }))
}

describe("CBI — estrutura", () => {
  it("tem 19 itens e 3 dimensões", () => {
    expect(itens.length).toBe(19)
    expect(CBI_BR.dominios[0].dimensoes.length).toBe(3)
  })
  it("item de energia para a vida pessoal é reverso", () => {
    expect(itens.find((i) => i.id === "C13")?.reverso).toBe(true)
  })
})

describe("CBI — scoring (média 0-100, faixas de burnout)", () => {
  it("respostas baixas = burnout baixo (verde); respostas altas = alto (vermelho)", () => {
    const baixo = processarInstrumento(CBI_BR, respondentes(0), "unica", 5)
    // Esgotamento pessoal: tudo 0 → risco 0 → verde
    expect(baixo.find((d) => d.dimensao_id === "esgotamento_pessoal")!.classificacao).toBe("verde")
    const alto = processarInstrumento(CBI_BR, respondentes(100), "unica", 5)
    expect(alto.find((d) => d.dimensao_id === "esgotamento_pessoal")!.score).toBe(100)
    expect(alto.find((d) => d.dimensao_id === "esgotamento_pessoal")!.classificacao).toBe("vermelho")
  })
  it("todas as dimensões são desfecho", () => {
    const res = processarInstrumento(CBI_BR, respondentes(50), "unica", 5)
    expect(res.every((d) => d.tipo === "desfecho")).toBe(true)
  })
})

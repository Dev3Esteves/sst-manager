import { describe, it, expect } from "vitest"
import { calcConformidade, type RespostaItem } from "./inspecao"

function resposta(conforme: "sim" | "nao" | "na", idx = 0): RespostaItem {
  return {
    item_index: idx,
    pergunta: `Item ${idx}`,
    grupo: null,
    conforme,
    observacao: null,
    foto_url: null,
  }
}

describe("calcConformidade", () => {
  it("retorna 100 quando lista vazia (evita divisão por zero)", () => {
    expect(calcConformidade([])).toBe(100)
  })

  it("retorna 100 quando apenas N/A (ignorados do cálculo)", () => {
    expect(calcConformidade([
      resposta("na", 0),
      resposta("na", 1),
    ])).toBe(100)
  })

  it("retorna 100 quando todos conformes", () => {
    expect(calcConformidade([
      resposta("sim", 0),
      resposta("sim", 1),
      resposta("sim", 2),
    ])).toBe(100)
  })

  it("retorna 0 quando todos NC", () => {
    expect(calcConformidade([
      resposta("nao", 0),
      resposta("nao", 1),
    ])).toBe(0)
  })

  it("calcula porcentagem com 2 casas decimais", () => {
    // 1 conforme de 3 = 33.33%
    expect(calcConformidade([
      resposta("sim", 0),
      resposta("nao", 1),
      resposta("nao", 2),
    ])).toBe(33.33)
  })

  it("ignora N/A no cálculo do denominador", () => {
    // 2 considerados (1 sim, 1 nao) = 50%, N/A ignorados
    expect(calcConformidade([
      resposta("sim", 0),
      resposta("nao", 1),
      resposta("na", 2),
      resposta("na", 3),
    ])).toBe(50)
  })

  it("calcula 75% corretamente (3 de 4)", () => {
    expect(calcConformidade([
      resposta("sim", 0),
      resposta("sim", 1),
      resposta("sim", 2),
      resposta("nao", 3),
    ])).toBe(75)
  })
})

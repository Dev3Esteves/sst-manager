import { describe, it, expect } from "vitest"
import {
  pontoPedido, consumoMedioDiario, coberturaDias, giroEstoque,
  emRuptura, valorizacaoTotal, curvaAbc,
} from "./calculos"

describe("pontoPedido", () => {
  it("= consumo diário × lead time + segurança", () => {
    expect(pontoPedido(2, 7, 5)).toBe(19)
    expect(pontoPedido(0, 10, 3)).toBe(3)
  })
})

describe("consumoMedioDiario / coberturaDias / giroEstoque", () => {
  it("consumo médio diário", () => {
    expect(consumoMedioDiario(180, 90)).toBe(2)
    expect(consumoMedioDiario(10, 0)).toBe(0)
  })
  it("cobertura em dias (null se consumo 0)", () => {
    expect(coberturaDias(20, 2)).toBe(10)
    expect(coberturaDias(20, 0)).toBeNull()
  })
  it("giro (null se saldo médio 0)", () => {
    expect(giroEstoque(100, 25)).toBe(4)
    expect(giroEstoque(100, 0)).toBeNull()
  })
})

describe("emRuptura", () => {
  it("true quando saldo ≤ ponto de pedido (>0)", () => {
    expect(emRuptura(5, 10)).toBe(true)
    expect(emRuptura(10, 10)).toBe(true)
    expect(emRuptura(11, 10)).toBe(false)
  })
  it("false quando ponto de pedido nulo/zero", () => {
    expect(emRuptura(0, null)).toBe(false)
    expect(emRuptura(0, 0)).toBe(false)
  })
})

describe("valorizacaoTotal", () => {
  it("soma custos totais ignorando nulos", () => {
    expect(valorizacaoTotal([{ custo_total: 100 }, { custo_total: 50.5 }, { custo_total: null }])).toBe(150.5)
  })
})

describe("curvaAbc", () => {
  it("classifica por Pareto (A≤80%, B≤95%, C resto)", () => {
    const m = curvaAbc([
      { id: "a", valorConsumido: 800 }, // 80% acumulado → A
      { id: "b", valorConsumido: 150 }, // 95% → B
      { id: "c", valorConsumido: 50 },  // 100% → C
    ])
    expect(m.get("a")).toBe("A")
    expect(m.get("b")).toBe("B")
    expect(m.get("c")).toBe("C")
  })
  it("tudo C quando não há consumo", () => {
    const m = curvaAbc([{ id: "x", valorConsumido: 0 }, { id: "y", valorConsumido: 0 }])
    expect(m.get("x")).toBe("C")
    expect(m.get("y")).toBe("C")
  })
})

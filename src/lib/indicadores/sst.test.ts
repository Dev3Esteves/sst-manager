import { describe, it, expect } from "vitest"
import {
  BASE_HORAS_NBR_14280,
  JORNADA_MENSAL_PADRAO_HORAS,
  calcularHHT,
  diasParaHoras,
  calcularTF,
  calcularTG,
} from "./sst"

describe("calcularHHT", () => {
  it("usa jornada mensal padrão (220h) quando não especificada", () => {
    expect(calcularHHT({ colaboradoresAtivos: 100 })).toBe(100 * 220)
  })

  it("respeita jornada mensal customizada (12×36, por ex.)", () => {
    // 12×36 ≈ 180h/mês
    expect(calcularHHT({ colaboradoresAtivos: 50, jornadaMensalHoras: 180 })).toBe(50 * 180)
  })

  it("subtrai horas afastadas do total teórico", () => {
    const hht = calcularHHT({
      colaboradoresAtivos: 10,
      horasAfastadas: 200,
    })
    expect(hht).toBe(10 * 220 - 200) // 2000
  })

  it("clampa em 0 quando afastadas > teórico (não retorna negativo)", () => {
    const hht = calcularHHT({
      colaboradoresAtivos: 5,
      horasAfastadas: 999_999,
    })
    expect(hht).toBe(0)
  })

  it("retorna 0 quando sem colaboradores", () => {
    expect(calcularHHT({ colaboradoresAtivos: 0 })).toBe(0)
  })
})

describe("diasParaHoras", () => {
  it("converte dias em horas com jornada padrão de 8h/dia", () => {
    expect(diasParaHoras(5)).toBe(40)
    expect(diasParaHoras(0)).toBe(0)
  })

  it("aceita jornada diária customizada", () => {
    expect(diasParaHoras(5, 6)).toBe(30)
  })

  it("clampa dias negativos em 0", () => {
    expect(diasParaHoras(-3)).toBe(0)
  })
})

describe("calcularTF (NBR 14280)", () => {
  it("retorna 0 quando HHT <= 0", () => {
    expect(calcularTF(3, 0)).toBe(0)
    expect(calcularTF(3, -100)).toBe(0)
  })

  it("retorna 0 quando não há acidentes", () => {
    expect(calcularTF(0, 100_000)).toBe(0)
  })

  it("aplica a base 1.000.000h corretamente", () => {
    // 2 acidentes / 100.000h = 20 por milhão
    expect(calcularTF(2, 100_000)).toBe(20)
  })

  it("usa exatamente a constante BASE_HORAS_NBR_14280", () => {
    expect(calcularTF(1, BASE_HORAS_NBR_14280)).toBe(1)
  })
})

describe("calcularTG (NBR 14280)", () => {
  it("retorna 0 quando HHT <= 0", () => {
    expect(calcularTG(50, 0, 0)).toBe(0)
  })

  it("retorna 0 quando não há dias", () => {
    expect(calcularTG(0, 0, 100_000)).toBe(0)
  })

  it("aplica a base 1.000.000h e soma perdidos + debitados", () => {
    // (30 + 70) × 10^6 / 100_000 = 1000
    expect(calcularTG(30, 70, 100_000)).toBe(1000)
  })

  it("comporta-se sem dias debitados (fallback até catálogo NBR 14280 existir)", () => {
    // Sem dias debitados ⇒ TG só reflete afastamentos reais (subestima fatalidade)
    expect(calcularTG(15, 0, 100_000)).toBe(150)
  })

  it("contabiliza morte por dias debitados (NBR 14280: 6000 dias)", () => {
    // 1 fatalidade ⇒ 6000 dias debitados, 0 perdidos (não dá afastamento, é óbito)
    // HHT = 1M ⇒ TG = 6000
    expect(calcularTG(0, 6000, 1_000_000)).toBe(6000)
  })
})

describe("integração end-to-end", () => {
  it("calcula HHT e TF/TG para cenário típico", () => {
    // 100 colaboradores, mês com 5 dias de afastamento total, 1 acidente
    const horasAfastadas = diasParaHoras(5)
    const hht = calcularHHT({ colaboradoresAtivos: 100, horasAfastadas })

    expect(hht).toBe(100 * JORNADA_MENSAL_PADRAO_HORAS - 40) // 21.960
    expect(calcularTF(1, hht)).toBeCloseTo(1_000_000 / 21_960, 2)
    expect(calcularTG(5, 0, hht)).toBeCloseTo(5_000_000 / 21_960, 2)
  })
})

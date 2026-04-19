import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { parseMesRef, mesAnterior, listarMeses, variacaoPct } from "./relatorio-mensal"

describe("parseMesRef", () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-18T12:00:00Z"))
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  it("parseia formato YYYY-MM", () => {
    const ref = parseMesRef("2026-03")
    expect(ref.ano).toBe(2026)
    expect(ref.mes).toBe(3)
    expect(ref.inicio).toBe("2026-03-01")
    expect(ref.fim).toBe("2026-04-01")
    expect(ref.label).toBe("março de 2026")
  })

  it("fallback para mês atual se input vazio", () => {
    const ref = parseMesRef(null)
    expect(ref.ano).toBe(2026)
    expect(ref.mes).toBe(4)
  })

  it("fallback para mês atual se formato inválido", () => {
    const ref = parseMesRef("não-é-data")
    expect(ref.ano).toBe(2026)
    expect(ref.mes).toBe(4)
  })

  it("wrap de dezembro → janeiro do próximo ano", () => {
    const ref = parseMesRef("2026-12")
    expect(ref.fim).toBe("2027-01-01")
    expect(ref.label).toBe("dezembro de 2026")
  })

  it("aceita mês com 1 dígito", () => {
    const ref = parseMesRef("2026-3")
    expect(ref.mes).toBe(3)
    expect(ref.inicio).toBe("2026-03-01")
  })
})

describe("mesAnterior", () => {
  it("retorna mês anterior no mesmo ano", () => {
    const ref = parseMesRef("2026-04")
    const ant = mesAnterior(ref)
    expect(ant.ano).toBe(2026)
    expect(ant.mes).toBe(3)
  })

  it("retorna dezembro do ano anterior para janeiro", () => {
    const ref = parseMesRef("2026-01")
    const ant = mesAnterior(ref)
    expect(ant.ano).toBe(2025)
    expect(ant.mes).toBe(12)
  })
})

describe("listarMeses", () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-18T12:00:00Z"))
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  it("retorna N meses em ordem reversa (atual primeiro)", () => {
    const meses = listarMeses(3)
    expect(meses).toHaveLength(3)
    expect(meses[0].mes).toBe(4)
    expect(meses[1].mes).toBe(3)
    expect(meses[2].mes).toBe(2)
  })

  it("atravessa anos corretamente", () => {
    const meses = listarMeses(5)
    // de 2026-04 até 2025-12
    expect(meses[0].ano).toBe(2026)
    expect(meses[0].mes).toBe(4)
    expect(meses[4].ano).toBe(2025)
    expect(meses[4].mes).toBe(12)
  })

  it("default é 12 meses", () => {
    expect(listarMeses().length).toBe(12)
  })
})

describe("variacaoPct", () => {
  it("calcula subida", () => {
    const v = variacaoPct(15, 10)
    expect(v.valor).toBe(5)
    expect(v.pct).toBe(50)
    expect(v.direcao).toBe("subiu")
  })

  it("calcula queda", () => {
    const v = variacaoPct(5, 10)
    expect(v.valor).toBe(-5)
    expect(v.pct).toBe(-50)
    expect(v.direcao).toBe("caiu")
  })

  it("detecta igual", () => {
    const v = variacaoPct(8, 8)
    expect(v.valor).toBe(0)
    expect(v.pct).toBe(0)
    expect(v.direcao).toBe("igual")
  })

  it("trata zero anterior com valor atual (retorna 100%)", () => {
    const v = variacaoPct(5, 0)
    expect(v.pct).toBe(100)
    expect(v.direcao).toBe("subiu")
  })

  it("trata zero para zero (retorna 0%)", () => {
    const v = variacaoPct(0, 0)
    expect(v.pct).toBe(0)
    expect(v.direcao).toBe("igual")
  })

  it("arredonda pct para 1 casa decimal", () => {
    const v = variacaoPct(10, 3)
    // (10-3)/3 = 233.33%
    expect(v.pct).toBe(233.3)
  })
})

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { classificarVencimento, urgenciaLabel, urgenciaBadgeVariant, formatDate } from "./vencimento"

describe("classificarVencimento", () => {
  // Congela o tempo em uma data conhecida para testes determinísticos
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-18T12:00:00Z"))
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  it("retorna null para data ausente", () => {
    expect(classificarVencimento(null)).toBeNull()
    expect(classificarVencimento(undefined)).toBeNull()
    expect(classificarVencimento("")).toBeNull()
  })

  it("classifica como VENCIDO quando passou", () => {
    expect(classificarVencimento("2026-04-17")).toBe("vencido") // ontem
    expect(classificarVencimento("2025-01-01")).toBe("vencido") // ano passado
  })

  it("classifica como CRITICO quando ≤30 dias", () => {
    expect(classificarVencimento("2026-04-18")).toBe("critico") // hoje
    expect(classificarVencimento("2026-05-01")).toBe("critico") // 13 dias
    expect(classificarVencimento("2026-05-18")).toBe("critico") // 30 dias exatos
  })

  it("classifica como ALERTA quando entre 31 e 60 dias", () => {
    expect(classificarVencimento("2026-05-19")).toBe("alerta") // 31 dias
    expect(classificarVencimento("2026-06-17")).toBe("alerta") // 60 dias exatos
  })

  it("classifica como REGULAR quando >60 dias", () => {
    expect(classificarVencimento("2026-06-18")).toBe("regular") // 61 dias
    expect(classificarVencimento("2027-04-18")).toBe("regular") // 1 ano
  })
})

describe("urgenciaLabel", () => {
  it("retorna traduções em português", () => {
    expect(urgenciaLabel("regular")).toBe("Em dia")
    expect(urgenciaLabel("alerta")).toBe("Alerta")
    expect(urgenciaLabel("critico")).toBe("Crítico")
    expect(urgenciaLabel("vencido")).toBe("Vencido")
    expect(urgenciaLabel(null)).toBe("—")
  })
})

describe("urgenciaBadgeVariant", () => {
  it("mapeia para variants de badge", () => {
    expect(urgenciaBadgeVariant("regular")).toBe("regular")
    expect(urgenciaBadgeVariant("alerta")).toBe("alerta")
    expect(urgenciaBadgeVariant("critico")).toBe("critico")
    expect(urgenciaBadgeVariant("vencido")).toBe("vencido")
    expect(urgenciaBadgeVariant(null)).toBe("secondary")
  })
})

describe("formatDate", () => {
  it("formata ISO para dd/mm/aaaa", () => {
    expect(formatDate("2026-04-17")).toBe("17/04/2026")
    expect(formatDate("2026-01-01")).toBe("01/01/2026")
  })

  it("extrai apenas data de timestamps completos", () => {
    expect(formatDate("2026-04-17T15:30:00Z")).toBe("17/04/2026")
  })

  it("retorna — para valores nulos/vazios", () => {
    expect(formatDate(null)).toBe("—")
    expect(formatDate(undefined)).toBe("—")
  })
})

import { describe, it, expect } from "vitest"
import { formatDataHora } from "./data-brasilia"

describe("formatDataHora", () => {
  it("converte um timestamp UTC para o fuso de Brasília (UTC-3)", () => {
    // 23:30Z = 20:30 em Brasília, mesmo dia.
    const out = formatDataHora("2026-06-18T23:30:00Z")
    expect(out).toContain("18/06/2026")
    expect(out).toContain("20:30")
    expect(out).not.toContain("23:30") // não pode mostrar o horário UTC cru
  })

  it("volta para o dia anterior quando o UTC já passou da meia-noite", () => {
    // 01:00Z do dia 19 = 22:00 do dia 18 em Brasília.
    const out = formatDataHora("2026-06-19T01:00:00Z")
    expect(out).toContain("18/06/2026")
    expect(out).toContain("22:00")
  })

  it("retorna '—' para valores ausentes ou inválidos", () => {
    expect(formatDataHora(null)).toBe("—")
    expect(formatDataHora(undefined)).toBe("—")
    expect(formatDataHora("não é data")).toBe("—")
  })
})

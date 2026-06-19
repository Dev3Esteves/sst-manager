import { describe, it, expect } from "vitest"
import { ehPropria, LABEL_PROPRIA, LABEL_PARCEIRO } from "./classificacao"

describe("ehPropria", () => {
  it("é true apenas quando propria === true", () => {
    expect(ehPropria({ propria: true })).toBe(true)
  })

  it("é false para parceiro (false/null/undefined/ausente)", () => {
    expect(ehPropria({ propria: false })).toBe(false)
    expect(ehPropria({ propria: null })).toBe(false)
    expect(ehPropria({})).toBe(false)
    expect(ehPropria(null)).toBe(false)
    expect(ehPropria(undefined)).toBe(false)
  })

  it("rótulos canônicos", () => {
    expect(LABEL_PROPRIA).toBe("Empresa própria")
    expect(LABEL_PARCEIRO).toBe("Parceiro")
  })
})

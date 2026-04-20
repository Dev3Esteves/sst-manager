import { describe, it, expect } from "vitest"
import { parsePageParam } from "./pagination"

describe("parsePageParam", () => {
  it("retorna 1 quando param ausente", () => {
    expect(parsePageParam(undefined)).toBe(1)
  })

  it("retorna 1 para string vazia", () => {
    expect(parsePageParam("")).toBe(1)
  })

  it("retorna 1 para não-numérico puro", () => {
    expect(parsePageParam("abc")).toBe(1)
  })

  it("aceita prefixo numérico (semântica do parseInt)", () => {
    // parseInt tolera sufixos não-numéricos — aceitamos esse comportamento
    expect(parsePageParam("3abc")).toBe(3)
    expect(parsePageParam("3.14.15")).toBe(3)
  })

  it("retorna 1 para zero ou negativo", () => {
    expect(parsePageParam("0")).toBe(1)
    expect(parsePageParam("-5")).toBe(1)
  })

  it("retorna o valor para inteiro positivo", () => {
    expect(parsePageParam("1")).toBe(1)
    expect(parsePageParam("42")).toBe(42)
  })

  it("aceita primeiro valor de array (Next.js pode passar string[])", () => {
    expect(parsePageParam(["3", "ignored"])).toBe(3)
    expect(parsePageParam([])).toBe(1)
  })

  it("trata espaços em branco via parseInt semantics", () => {
    expect(parsePageParam("  5  ")).toBe(5)
  })
})

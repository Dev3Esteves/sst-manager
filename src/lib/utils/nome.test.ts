import { describe, it, expect } from "vitest"
import { primeiroNome } from "./nome"

describe("primeiroNome", () => {
  it("retorna o primeiro termo de um nome completo", () => {
    expect(primeiroNome("Evandro Ferreira")).toBe("Evandro")
    expect(primeiroNome("Maria da Silva Santos")).toBe("Maria")
  })

  it("ignora espaços múltiplos", () => {
    expect(primeiroNome("  João   Paulo  da Silva  ")).toBe("João")
  })

  it("retorna null para entrada vazia, null ou só whitespace", () => {
    expect(primeiroNome("")).toBe(null)
    expect(primeiroNome("   ")).toBe(null)
    expect(primeiroNome(null)).toBe(null)
    expect(primeiroNome(undefined)).toBe(null)
  })

  it("preserva acentos e caracteres especiais", () => {
    expect(primeiroNome("Évandro Silva")).toBe("Évandro")
    expect(primeiroNome("José da Conceição")).toBe("José")
  })

  it("funciona com nome de uma palavra só", () => {
    expect(primeiroNome("Cristina")).toBe("Cristina")
  })

  it("retorna a primeira palavra mesmo com tab/newline entre partes", () => {
    expect(primeiroNome("Ana\tPaula")).toBe("Ana")
    expect(primeiroNome("Luis\nCarlos")).toBe("Luis")
  })
})

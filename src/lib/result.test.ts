import { describe, it, expect } from "vitest"
import { ok, err, errFields, isOk, isErr, type Result } from "./result"

describe("ok()", () => {
  it("cria success com payload", () => {
    const r = ok({ id: "abc" })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toEqual({ id: "abc" })
  })

  it("cria success sem payload (void)", () => {
    const r = ok()
    expect(r.ok).toBe(true)
  })

  it("aceita null/false/0 como dados válidos", () => {
    const r1 = ok(null)
    const r2 = ok(false)
    const r3 = ok(0)
    expect(r1.ok && r1.data).toBeNull()
    expect(r2.ok && r2.data).toBe(false)
    expect(r3.ok && r3.data).toBe(0)
  })
})

describe("err()", () => {
  it("cria erro simples só com mensagem", () => {
    const r = err("Algo falhou")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("Algo falhou")
  })

  it("aceita fieldErrors opcional", () => {
    const r = err("Formulário com erros", { email: ["Inválido"] })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.fieldErrors).toEqual({ email: ["Inválido"] })
    }
  })
})

describe("errFields()", () => {
  it("usa a primeira mensagem de campo como error principal", () => {
    const r = errFields({ email: ["Inválido"], senha: ["Muito curta"] })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toBe("Inválido")
      expect(r.fieldErrors).toEqual({ email: ["Inválido"], senha: ["Muito curta"] })
    }
  })

  it("usa fallback quando todos os campos estão vazios", () => {
    const r = errFields({ email: undefined, senha: [] })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("Dados inválidos")
  })

  it("aceita mensagem de fallback customizada", () => {
    const r = errFields({}, "Algo bizarro aconteceu")
    if (!r.ok) expect(r.error).toBe("Algo bizarro aconteceu")
  })
})

describe("type guards", () => {
  it("isOk estreita o tipo para data acessível", () => {
    const r: Result<{ x: number }> = ok({ x: 1 })
    if (isOk(r)) {
      // Se não estivesse narrowed, `r.data` seria erro de tipo
      expect(r.data.x).toBe(1)
    }
  })

  it("isErr estreita o tipo para error acessível", () => {
    const r: Result<{ x: number }> = err("falha")
    if (isErr(r)) {
      expect(r.error).toBe("falha")
    }
  })
})

describe("discriminated union exhaustive checking", () => {
  it("narrowing via destructuring funciona", () => {
    const r: Result<string> = ok("hello")
    if (r.ok) {
      // Dentro do bloco, TS sabe que é Success — r.error seria erro
      const upper = r.data.toUpperCase()
      expect(upper).toBe("HELLO")
    }
  })
})

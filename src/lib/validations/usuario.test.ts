import { describe, it, expect } from "vitest"
import { gerarSenhaForte, criarUsuarioSchema } from "./usuario"

describe("gerarSenhaForte", () => {
  it("gera senha com 16 caracteres", () => {
    for (let i = 0; i < 10; i++) {
      const senha = gerarSenhaForte()
      expect(senha.length).toBe(16)
    }
  })

  it("gera senhas diferentes a cada chamada", () => {
    const senhas = new Set<string>()
    for (let i = 0; i < 50; i++) senhas.add(gerarSenhaForte())
    // Com 16 chars variados a probabilidade de colisão é ínfima
    expect(senhas.size).toBe(50)
  })

  it("contém ao menos 1 minúscula", () => {
    for (let i = 0; i < 20; i++) {
      expect(gerarSenhaForte()).toMatch(/[a-z]/)
    }
  })

  it("contém ao menos 1 maiúscula", () => {
    for (let i = 0; i < 20; i++) {
      expect(gerarSenhaForte()).toMatch(/[A-Z]/)
    }
  })

  it("contém ao menos 1 dígito", () => {
    for (let i = 0; i < 20; i++) {
      expect(gerarSenhaForte()).toMatch(/[0-9]/)
    }
  })

  it("contém ao menos 1 símbolo", () => {
    for (let i = 0; i < 20; i++) {
      expect(gerarSenhaForte()).toMatch(/[!@#$%&*+\-?]/)
    }
  })

  it("evita caracteres confundíveis (l, I, O, 0, 1)", () => {
    // Garante que essas letras não aparecem (conforme documentado no código)
    for (let i = 0; i < 20; i++) {
      const senha = gerarSenhaForte()
      expect(senha).not.toContain("l")
      expect(senha).not.toContain("I")
      expect(senha).not.toContain("O")
      expect(senha).not.toContain("0")
      expect(senha).not.toContain("1")
    }
  })

  it("distribuição aproximadamente uniforme (1000 samples, chi-squared leve)", () => {
    // Teste estatístico básico: em 1000 senhas de 16 chars = 16_000 chars,
    // nenhum caractere do alfabeto deveria aparecer < 50% da média esperada
    // nem > 200%. Isso detecta viés grosseiro (ex.: modulo 256 sem rejection
    // sampling concentraria em certos caracteres).
    const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*+-?"
    const contagem: Record<string, number> = {}
    const totalChars = 1000 * 16
    for (let i = 0; i < 1000; i++) {
      for (const c of gerarSenhaForte()) {
        contagem[c] = (contagem[c] ?? 0) + 1
      }
    }
    const mediaEsperada = totalChars / alfabeto.length
    for (const c of alfabeto) {
      const freq = contagem[c] ?? 0
      // Aceita uma larga faixa — só queremos detectar viés grosseiro
      expect(freq).toBeGreaterThan(mediaEsperada * 0.4)
      expect(freq).toBeLessThan(mediaEsperada * 1.8)
    }
  })

  it("posição dos caracteres é distribuída (não ancora mandatórios no início)", () => {
    // Shuffle Fisher-Yates garante que o minúsculo mandatório pode aparecer
    // em qualquer posição — não só nas 4 primeiras. Antes (sort Math.random)
    // havia viés estatístico que concentrava mandatórios no início.
    const posicoesDoPrimeiroSimbolo: number[] = []
    for (let i = 0; i < 200; i++) {
      const senha = gerarSenhaForte()
      const idx = senha.search(/[!@#$%&*+\-?]/)
      if (idx !== -1) posicoesDoPrimeiroSimbolo.push(idx)
    }
    // Pelo menos uma das 200 senhas deve ter símbolo depois da posição 6
    const comSimboloTardio = posicoesDoPrimeiroSimbolo.filter((i) => i > 6)
    expect(comSimboloTardio.length).toBeGreaterThan(0)
  })
})

describe("criarUsuarioSchema", () => {
  const validPayload = {
    email: "teste@exemplo.com.br",
    senha: "SenhaForte123!",
    perfil_id: "00000000-0000-4000-8000-000000000001",
    empresa_id: "00000000-0000-4000-8000-000000000002",
    colaborador_id: null,
    ativo: true,
  }

  it("aceita payload válido", () => {
    const result = criarUsuarioSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it("rejeita e-mail inválido", () => {
    const result = criarUsuarioSchema.safeParse({ ...validPayload, email: "sem-arroba" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("E-mail")
    }
  })

  it("rejeita senha com menos de 8 caracteres", () => {
    const result = criarUsuarioSchema.safeParse({ ...validPayload, senha: "Curta1!" })
    expect(result.success).toBe(false)
  })

  it("rejeita perfil_id não-UUID", () => {
    const result = criarUsuarioSchema.safeParse({ ...validPayload, perfil_id: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("aceita colaborador_id null", () => {
    const result = criarUsuarioSchema.safeParse({ ...validPayload, colaborador_id: null })
    expect(result.success).toBe(true)
  })
})

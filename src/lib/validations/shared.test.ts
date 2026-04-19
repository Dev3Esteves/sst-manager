import { describe, it, expect } from "vitest"
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ, cpfSchema, cnpjSchema } from "./shared"

describe("validateCPF", () => {
  it.each([
    ["11144477735"],          // válido (número real usado para teste)
    ["111.444.777-35"],       // válido com formatação
    ["529.982.247-25"],       // válido
    ["52998224725"],          // mesmo, sem formatação
  ])("aceita CPF válido: %s", (cpf) => {
    expect(validateCPF(cpf)).toBe(true)
  })

  it.each([
    [""],
    ["123"],                    // muito curto
    ["12345678900"],            // dígitos aleatórios
    ["11111111111"],            // todos iguais (rejeita por regra)
    ["00000000000"],            // zeros
    ["111.444.777-34"],         // 1 dígito errado (último)
    ["abc.def.ghi-jk"],         // não-numérico
    ["1234567890"],             // 10 dígitos
    ["123456789012"],           // 12 dígitos
  ])("rejeita CPF inválido: %s", (cpf) => {
    expect(validateCPF(cpf)).toBe(false)
  })
})

describe("validateCNPJ", () => {
  it.each([
    ["11222333000181"],
    ["11.222.333/0001-81"],
  ])("aceita CNPJ válido: %s", (cnpj) => {
    expect(validateCNPJ(cnpj)).toBe(true)
  })

  it.each([
    [""],
    ["11222333000180"],          // último dígito errado
    ["11111111111111"],          // todos iguais
    ["00000000000000"],
    ["abc"],
    ["1122233300018"],           // 13 dígitos
  ])("rejeita CNPJ inválido: %s", (cnpj) => {
    expect(validateCNPJ(cnpj)).toBe(false)
  })
})

describe("formatCPF", () => {
  it("formata CPF sem pontos", () => {
    expect(formatCPF("11144477735")).toBe("111.444.777-35")
  })
  it("preserva CPF já formatado", () => {
    expect(formatCPF("111.444.777-35")).toBe("111.444.777-35")
  })
  it("remove caracteres não-numéricos", () => {
    expect(formatCPF("111-444-777-35abc")).toBe("111.444.777-35")
  })
})

describe("formatCNPJ", () => {
  it("formata CNPJ sem pontuação", () => {
    expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81")
  })
  it("preserva CNPJ já formatado", () => {
    expect(formatCNPJ("11.222.333/0001-81")).toBe("11.222.333/0001-81")
  })
})

describe("cpfSchema (Zod)", () => {
  it("transforma e valida", () => {
    const result = cpfSchema.safeParse("111.444.777-35")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe("11144477735") // transform remove não-dígitos
    }
  })

  it("rejeita CPF inválido com mensagem útil", () => {
    const result = cpfSchema.safeParse("12345678900")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("inválido")
    }
  })

  it("rejeita CPF curto", () => {
    const result = cpfSchema.safeParse("12345")
    expect(result.success).toBe(false)
  })
})

describe("cnpjSchema (Zod)", () => {
  it("aceita CNPJ formatado", () => {
    const result = cnpjSchema.safeParse("11.222.333/0001-81")
    expect(result.success).toBe(true)
  })

  it("rejeita CNPJ inválido", () => {
    const result = cnpjSchema.safeParse("11.222.333/0001-80")
    expect(result.success).toBe(false)
  })
})

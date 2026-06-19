import { describe, it, expect } from "vitest"
import { empresaSchema, TIPO_EMPRESA_LABEL } from "./empresa"

const UUID = "00000000-0000-0000-0000-000000000001"
const CNPJ_VALIDO = "45.543.915/0001-81"

describe("empresaSchema", () => {
  it("aceita empresa mínima como prestadora (defaults)", () => {
    const parsed = empresaSchema.safeParse({
      razao_social: "Prestadora Exemplo Ltda",
      cnpj: CNPJ_VALIDO,
      tipo: "terceira",
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      // defaults
      expect(parsed.data.propria).toBe(false)
      expect(parsed.data.ativo).toBe(true)
    }
  })

  it("aceita empresa própria", () => {
    const parsed = empresaSchema.safeParse({
      razao_social: "Empresa Demo Ltda",
      cnpj: CNPJ_VALIDO,
      tipo: "propria",
      propria: true,
    })
    expect(parsed.success).toBe(true)
  })

  it("aceita vinculação a empresa mãe via UUID", () => {
    const parsed = empresaSchema.safeParse({
      razao_social: "Prestadora X",
      cnpj: CNPJ_VALIDO,
      tipo: "terceira",
      empresa_mae_id: UUID,
    })
    expect(parsed.success).toBe(true)
  })

  it("rejeita empresa_mae_id que não é UUID", () => {
    const parsed = empresaSchema.safeParse({
      razao_social: "Prestadora X",
      cnpj: CNPJ_VALIDO,
      tipo: "terceira",
      empresa_mae_id: "não-uuid",
    })
    expect(parsed.success).toBe(false)
  })

  it("rejeita tipo inválido", () => {
    const parsed = empresaSchema.safeParse({
      razao_social: "Empresa Teste",
      cnpj: CNPJ_VALIDO,
      tipo: "outro_tipo",
    })
    expect(parsed.success).toBe(false)
  })

  it("rejeita razão social curta", () => {
    const parsed = empresaSchema.safeParse({
      razao_social: "A",
      cnpj: CNPJ_VALIDO,
      tipo: "propria",
    })
    expect(parsed.success).toBe(false)
  })

  it("aceita empresa_mae_id null", () => {
    const parsed = empresaSchema.safeParse({
      razao_social: "Dona",
      cnpj: CNPJ_VALIDO,
      tipo: "propria",
      empresa_mae_id: null,
    })
    expect(parsed.success).toBe(true)
  })
})

describe("TIPO_EMPRESA_LABEL", () => {
  it("mapeia os 3 tipos para labels legíveis", () => {
    expect(TIPO_EMPRESA_LABEL.propria).toBe("Empresa própria")
    expect(TIPO_EMPRESA_LABEL.contratante).toBe("Cliente")
    expect(TIPO_EMPRESA_LABEL.terceira).toBe("Prestadora")
  })
})

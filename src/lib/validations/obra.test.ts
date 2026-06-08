import { describe, it, expect } from "vitest"
import { obraSchema, UFS } from "./obra"

const UUID = "00000000-0000-0000-0000-000000000001"

describe("obraSchema", () => {
  it("aceita uma obra mínima válida (só nome + empresa)", () => {
    const parsed = obraSchema.safeParse({
      empresa_id: UUID,
      nome: "OBRA EXEMPLO",
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      // defaults aplicados
      expect(parsed.data.ativa).toBe(true)
    }
  })

  it("rejeita nome curto", () => {
    const parsed = obraSchema.safeParse({
      empresa_id: UUID,
      nome: "A",
    })
    expect(parsed.success).toBe(false)
  })

  it("rejeita empresa_id que não é UUID", () => {
    const parsed = obraSchema.safeParse({
      empresa_id: "não-é-uuid",
      nome: "Obra X",
    })
    expect(parsed.success).toBe(false)
  })

  it("aceita UF válida e rejeita UF inválida", () => {
    const valid = obraSchema.safeParse({
      empresa_id: UUID,
      nome: "Obra X",
      uf: "SP",
    })
    expect(valid.success).toBe(true)

    const invalid = obraSchema.safeParse({
      empresa_id: UUID,
      nome: "Obra X",
      uf: "XX",
    })
    expect(invalid.success).toBe(false)
  })

  it("lista de UFs cobre as 27 unidades federativas brasileiras", () => {
    // 26 estados + DF
    expect(UFS).toHaveLength(27)
    expect(UFS).toContain("SP")
    expect(UFS).toContain("DF")
    expect(UFS).toContain("RR")
  })

  it("aceita contratante_id null ou undefined", () => {
    const parsed1 = obraSchema.safeParse({
      empresa_id: UUID,
      nome: "Obra X",
      contratante_id: null,
    })
    const parsed2 = obraSchema.safeParse({
      empresa_id: UUID,
      nome: "Obra X",
    })
    expect(parsed1.success).toBe(true)
    expect(parsed2.success).toBe(true)
  })
})

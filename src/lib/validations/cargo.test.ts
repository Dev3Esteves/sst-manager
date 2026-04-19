import { describe, it, expect } from "vitest"
import { cargoSchema, episPorCargoSchema, EPIS_POR_CARGO_VAZIO } from "./cargo"

const UUID_EMP = "00000000-0000-0000-0000-000000000001"
const UUID_EPI_A = "00000000-0000-0000-0000-00000000aaaa"
const UUID_EPI_B = "00000000-0000-0000-0000-00000000bbbb"

describe("cargoSchema", () => {
  it("aceita cargo mínimo (empresa + título)", () => {
    const parsed = cargoSchema.safeParse({
      empresa_id: UUID_EMP,
      titulo: "Encarregado",
    })
    expect(parsed.success).toBe(true)
  })

  it("rejeita título com menos de 2 caracteres", () => {
    const parsed = cargoSchema.safeParse({
      empresa_id: UUID_EMP,
      titulo: "A",
    })
    expect(parsed.success).toBe(false)
  })

  it("aceita grupo_risco 1-4 e rejeita fora da faixa", () => {
    const ok = cargoSchema.safeParse({
      empresa_id: UUID_EMP, titulo: "Soldador", grupo_risco: 3,
    })
    expect(ok.success).toBe(true)

    const tooHigh = cargoSchema.safeParse({
      empresa_id: UUID_EMP, titulo: "Soldador", grupo_risco: 5,
    })
    expect(tooHigh.success).toBe(false)

    const tooLow = cargoSchema.safeParse({
      empresa_id: UUID_EMP, titulo: "Soldador", grupo_risco: 0,
    })
    expect(tooLow.success).toBe(false)
  })

  it("coerce grupo_risco de string para número (vindo do form)", () => {
    const parsed = cargoSchema.safeParse({
      empresa_id: UUID_EMP, titulo: "Soldador", grupo_risco: "3",
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.grupo_risco).toBe(3)
  })

  it("aceita epis_obrigatorios com estrutura {obrigatorios, eventuais}", () => {
    const parsed = cargoSchema.safeParse({
      empresa_id: UUID_EMP,
      titulo: "Eletricista",
      epis_obrigatorios: {
        obrigatorios: [
          { epi_id: UUID_EPI_A, observacao: "Classe 3 para MT" },
        ],
        eventuais: [
          { epi_id: UUID_EPI_B, observacao: null },
        ],
      },
    })
    expect(parsed.success).toBe(true)
  })
})

describe("episPorCargoSchema", () => {
  it("aplica default vazio quando campo ausente", () => {
    const parsed = episPorCargoSchema.safeParse({})
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.obrigatorios).toEqual([])
      expect(parsed.data.eventuais).toEqual([])
    }
  })

  it("rejeita epi_id que não é UUID", () => {
    const parsed = episPorCargoSchema.safeParse({
      obrigatorios: [{ epi_id: "xxx", observacao: "obs" }],
      eventuais: [],
    })
    expect(parsed.success).toBe(false)
  })

  it("EPIS_POR_CARGO_VAZIO é vazio em ambas as listas", () => {
    expect(EPIS_POR_CARGO_VAZIO.obrigatorios).toEqual([])
    expect(EPIS_POR_CARGO_VAZIO.eventuais).toEqual([])
  })

  it("aceita observação nula ou ausente", () => {
    const a = episPorCargoSchema.safeParse({
      obrigatorios: [{ epi_id: UUID_EPI_A, observacao: null }],
      eventuais: [],
    })
    const b = episPorCargoSchema.safeParse({
      obrigatorios: [{ epi_id: UUID_EPI_A }],
      eventuais: [],
    })
    expect(a.success).toBe(true)
    expect(b.success).toBe(true)
  })
})

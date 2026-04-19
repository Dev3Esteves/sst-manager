import { describe, it, expect } from "vitest"
import { corDaEmpresa } from "./empresa-badge"

/**
 * A cor do badge precisa ser estável — o mesmo UUID sempre mapeia para a
 * mesma classe Tailwind, tanto no SSR quanto no client. Isso evita flash
 * de cor diferente durante hidratação.
 */
describe("corDaEmpresa", () => {
  const UUID_A = "11111111-1111-1111-1111-111111111111"

  it("retorna a mesma cor para o mesmo id (determinístico)", () => {
    const c1 = corDaEmpresa(UUID_A)
    const c2 = corDaEmpresa(UUID_A)
    expect(c1).toBe(c2)
  })

  it("retorna cor padrão (primeiro índice da paleta) para id vazio ou null", () => {
    const padrao = corDaEmpresa(null)
    const padraoUndef = corDaEmpresa(undefined)
    expect(padrao).toBe(padraoUndef)
    expect(padrao).toContain("bg-blue-500/15")
  })

  it("a paleta é distribuída (11 UUIDs diferentes ativam pelo menos 2 cores distintas)", () => {
    // Com paleta de 10 cores, 11 UUIDs garantem colisão mas também variedade
    const ids = Array.from({ length: 11 }, (_, i) =>
      `${String(i).padStart(8, "0")}-aaaa-bbbb-cccc-dddddddddddd`,
    )
    const cores = new Set(ids.map(corDaEmpresa))
    // Pelo menos 2 cores distintas — garante que o hash não retorna sempre a mesma
    expect(cores.size).toBeGreaterThan(1)
  })

  it("retorna uma string de classes Tailwind com bg, text e ring", () => {
    const cor = corDaEmpresa(UUID_A)
    expect(cor).toMatch(/bg-\w+-\d+\/15/)
    expect(cor).toMatch(/text-\w+-\d+/)
    expect(cor).toMatch(/ring-\w+-\d+\/\d+/)
  })
})

import { describe, it, expect } from "vitest"
import { calcNextRetryDelay, MAX_RETRIES } from "./db"

/**
 * Os testes do IndexedDB real precisariam de um polyfill (fake-indexeddb).
 * Aqui cobrimos a política de backoff pura — o coração da confiabilidade.
 */
describe("calcNextRetryDelay", () => {
  it("primeira falha: ~60s (com jitter ±20%)", () => {
    // Roda muitas vezes — garante que cai na faixa esperada
    for (let i = 0; i < 100; i++) {
      const d = calcNextRetryDelay(1)
      expect(d).toBeGreaterThanOrEqual(48_000) // 60 * 0.8
      expect(d).toBeLessThanOrEqual(72_000)    // 60 * 1.2
    }
  })

  it("tentativa 2: ~120s (dobra)", () => {
    for (let i = 0; i < 50; i++) {
      const d = calcNextRetryDelay(2)
      expect(d).toBeGreaterThanOrEqual(96_000)
      expect(d).toBeLessThanOrEqual(144_000)
    }
  })

  it("tentativa 3: ~240s", () => {
    for (let i = 0; i < 50; i++) {
      const d = calcNextRetryDelay(3)
      expect(d).toBeGreaterThanOrEqual(192_000)
      expect(d).toBeLessThanOrEqual(288_000)
    }
  })

  it("capa em 1 hora mesmo após muitas tentativas", () => {
    const capMs = 60 * 60_000
    for (let n = 8; n <= 15; n++) {
      for (let i = 0; i < 10; i++) {
        const d = calcNextRetryDelay(n)
        // Mesmo com jitter até 120% do cap, não pode passar disso
        expect(d).toBeLessThanOrEqual(capMs * 1.2)
        // Deve estar próximo do cap (pelo menos 80%)
        expect(d).toBeGreaterThanOrEqual(capMs * 0.8)
      }
    }
  })

  it("jitter é real — valores consecutivos são diferentes", () => {
    const valores = new Set<number>()
    for (let i = 0; i < 50; i++) valores.add(calcNextRetryDelay(3))
    // Com jitter contínuo, 50 samples devem ter pelo menos 40 únicos
    expect(valores.size).toBeGreaterThan(40)
  })

  it("retryCount 0 não causa NaN ou valor negativo", () => {
    const d = calcNextRetryDelay(0)
    expect(d).toBeGreaterThan(0)
    expect(Number.isFinite(d)).toBe(true)
  })

  it("MAX_RETRIES é razoável (entre 5 e 20)", () => {
    expect(MAX_RETRIES).toBeGreaterThanOrEqual(5)
    expect(MAX_RETRIES).toBeLessThanOrEqual(20)
  })

  it("tempo total para esgotar MAX_RETRIES é ≥ 1 hora (tempo confortável para investigar)", () => {
    // Soma dos backoffs médios (sem jitter) até MAX_RETRIES
    let total = 0
    const baseMs = 60_000
    const capMs = 60 * 60_000
    for (let n = 1; n <= MAX_RETRIES; n++) {
      const exp = Math.min(capMs, baseMs * Math.pow(2, n - 1))
      total += exp
    }
    // Com cap e 10 tentativas, total está acima de 1h — dá janela para reagir
    expect(total).toBeGreaterThan(60 * 60_000)
  })
})

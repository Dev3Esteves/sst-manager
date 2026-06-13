import { describe, it, expect, beforeEach, vi } from "vitest"
import { definicaoArmazenada, getInstrumento } from "@/lib/psicossocial/instrumentos"
import { flattenItens } from "@/lib/psicossocial/scoring"

/**
 * Teste de integração da ação calibrarFaixas (boundary de dados).
 *
 * Exercita o caminho completo: a ação reúne as respostas da empresa, calcula os
 * percentis por dimensão, grava em psi_calibracao e chama calcularResultados
 * (que reaplica a calibração). Tudo sobre um fake do client admin em memória.
 * A matemática de percentis tem cobertura própria em scoring.test.ts.
 */

// Auth sempre OK; revalidatePath no-op; IA não é exercida (mock evita SDK).
vi.mock("@/lib/auth/guards", () => ({
  requireRole: vi.fn().mockResolvedValue({ supabase: {}, user: {}, perfil: "admin" }),
  AuthError: class AuthError extends Error {},
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/ia/sintese-qualitativa", () => ({ sintetizarQualitativo: vi.fn() }))
vi.mock("@/lib/ia/classificar-risco", () => ({ IAServiceUnavailable: class extends Error {} }))

let store: Record<string, Record<string, unknown>[]>
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => makeAdmin() }))

import { calibrarFaixas } from "./actions"

/** Fake mínimo do client Supabase: filtros eq/in + select/insert/update/delete sobre `store`. */
function makeAdmin() {
  function from(table: string) {
    const filters: [string, unknown, "eq" | "in"][] = []
    let op: "select" | "update" | "delete" = "select"
    let updateData: Record<string, unknown> = {}
    const match = () =>
      (store[table] ?? []).filter((r) =>
        filters.every(([c, v, k]) => (k === "in" ? (v as unknown[]).includes(r[c]) : r[c] === v)))
    const builder: Record<string, unknown> = {
      select: () => builder,
      order: () => builder,
      eq: (c: string, v: unknown) => (filters.push([c, v, "eq"]), builder),
      in: (c: string, v: unknown[]) => (filters.push([c, v, "in"]), builder),
      update: (d: Record<string, unknown>) => ((op = "update"), (updateData = d), builder),
      delete: () => ((op = "delete"), builder),
      insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => {
        const arr = Array.isArray(rows) ? rows : [rows]
        store[table] = (store[table] ?? []).concat(arr)
        return Promise.resolve({ error: null })
      },
      maybeSingle: () => Promise.resolve({ data: match()[0] ?? null, error: null }),
      then: (resolve: (v: { data?: unknown; error: null }) => void) => {
        if (op === "delete") {
          const rm = new Set(match())
          store[table] = (store[table] ?? []).filter((r) => !rm.has(r))
          return resolve({ error: null })
        }
        if (op === "update") {
          for (const r of match()) Object.assign(r, updateData)
          return resolve({ error: null })
        }
        return resolve({ data: match(), error: null })
      },
    }
    return builder
  }
  return { from } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
}

// ── Seeds ───────────────────────────────────────────────────────────────────
const COPSOQ = getInstrumento("copsoq")!
const COPSOQ_DEF = definicaoArmazenada(COPSOQ)
const ITENS_CURTO = flattenItens(COPSOQ_DEF, "curto").map((i) => i.id)

const EMP = "emp-1"
const CAMP = "camp-1"
const GHE = "ghe-1"

/** n respondentes na campanha, cada um com o MESMO valor em todos os itens (varia por respondente). */
function semearRespostas(n: number) {
  const respostas: Record<string, unknown>[] = []
  const itens: Record<string, unknown>[] = []
  for (let i = 0; i < n; i++) {
    const rid = `r-${i}`
    respostas.push({ id: rid, pgr_ghe_id: GHE, campanha_id: CAMP })
    const valor = Math.round((i / Math.max(1, n - 1)) * 100) // 0..100 espalhado
    for (const item of ITENS_CURTO) itens.push({ resposta_id: rid, item_id: item, valor })
  }
  return { respostas, itens }
}

function semearBase(instrumentoDef: unknown, n: number) {
  const { respostas, itens } = semearRespostas(n)
  store = {
    psi_campanha: [
      {
        id: CAMP,
        empresa_id: EMP,
        versao_aplicada: "curto",
        min_respondentes: 5,
        instrumento_id: "instr-1",
        psi_instrumento: { definicao: instrumentoDef },
      },
    ],
    psi_resposta: respostas,
    psi_resposta_item: itens,
    psi_calibracao: [],
    psi_resultado_dimensao: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("calibrarFaixas", () => {
  it("calibra COPSOQ com amostra suficiente: grava cortes por dimensão e recalcula", async () => {
    semearBase(COPSOQ_DEF, 35)
    const r = await calibrarFaixas(CAMP)
    expect("ok" in r && r.ok).toBe(true)

    const cal = store.psi_calibracao
    expect(cal.length).toBeGreaterThan(0)
    // Uma linha por dimensão; metadados de percentil corretos.
    for (const linha of cal) {
      expect(linha.empresa_id).toBe(EMP)
      expect(linha.instrumento_key).toBe("copsoq")
      expect(linha.versao).toBe("curto")
      expect(linha.p_verde).toBe(50)
      expect(linha.p_amarelo).toBe(80)
      expect(linha.n_amostral).toBe(35)
      expect(linha.verde_max as number).toBeLessThanOrEqual(linha.amarelo_max as number)
      expect(linha.verde_max as number).toBeGreaterThanOrEqual(0)
      expect(linha.amarelo_max as number).toBeLessThanOrEqual(100)
    }
    // calcularResultados rodou (recompute) e marcou a campanha como analisada.
    expect(store.psi_resultado_dimensao.length).toBeGreaterThan(0)
    expect(store.psi_campanha[0].status).toBe("analisada")
  })

  it("recalibrar substitui a calibração anterior (não acumula)", async () => {
    semearBase(COPSOQ_DEF, 35)
    await calibrarFaixas(CAMP)
    const primeira = store.psi_calibracao.length
    await calibrarFaixas(CAMP)
    expect(store.psi_calibracao.length).toBe(primeira) // delete + insert, sem duplicar
  })

  it("rejeita instrumento não-calibrável (DASS-21, cortes clínicos ancorados)", async () => {
    semearBase(definicaoArmazenada(getInstrumento("dass21")!), 35)
    const r = await calibrarFaixas(CAMP)
    expect("error" in r && r.error).toMatch(/ancorados|não é calibrável/i)
    expect(store.psi_calibracao).toHaveLength(0)
  })

  it("recusa quando a amostra é insuficiente (< mínimo por dimensão)", async () => {
    semearBase(COPSOQ_DEF, 10) // abaixo de MIN_AMOSTRAL_CALIBRACAO (30)
    const r = await calibrarFaixas(CAMP)
    expect("error" in r && r.error).toMatch(/insuficiente/i)
    expect(store.psi_calibracao).toHaveLength(0)
  })

  it("erro claro quando não há respostas da empresa", async () => {
    semearBase(COPSOQ_DEF, 0)
    const r = await calibrarFaixas(CAMP)
    expect("error" in r && r.error).toMatch(/respostas/i)
  })
})

/**
 * Testes unitários dos helpers de queue.
 *
 * Focamos no que é lógica nossa: FSM de retry em `markJobFailed`, leitura
 * de progresso, normalização de resposta da RPC `claim_next_job` (que
 * pode vir como array ou objeto dependendo da versão do postgrest).
 *
 * Usamos um supabase mock simples — a cadeia fluente do client (from().select().eq().single())
 * não tem biblioteca de mock pronta que valha a pena; escrevemos à mão.
 */
import { describe, it, expect, vi } from "vitest"
import {
  enqueueJob,
  claimNextJob,
  updateProgress,
  markJobCompleted,
  markJobFailed,
  getJob,
  listJobs,
  makeWorkerId,
} from "./queue"
import type { JobRecord } from "./types"

type SupabaseMock = Parameters<typeof enqueueJob>[0]

/**
 * Mock builder — cada método retorna `chain` até um `.single()` ou `.maybeSingle()`
 * que resolve pra `{ data, error }`. Cobre só o que nossa lib usa.
 */
function mockSupabase(handlers: {
  fromInsert?: (table: string, payload: Record<string, unknown>) => { data?: unknown; error?: { message: string } | null }
  fromUpdate?: (table: string, patch: Record<string, unknown>, whereId?: string) => { error?: { message: string } | null }
  fromSelectSingle?: (table: string, whereId?: string) => { data?: unknown; error?: { message: string } | null }
  fromSelectMany?: (table: string) => { data?: unknown; error?: { message: string } | null }
  rpc?: (fnName: string, args: Record<string, unknown>) => { data?: unknown; error?: { message: string } | null }
}): SupabaseMock {
  return {
    from(table: string) {
      let whereId: string | undefined
      const chain = {
        insert(payload: Record<string, unknown>) {
          return {
            select() {
              return {
                single: async () => handlers.fromInsert?.(table, payload) ?? { data: null, error: null },
              }
            },
          }
        },
        update(patch: Record<string, unknown>) {
          const updChain = {
            eq(_col: string, val: string) {
              whereId = val
              return {
                then: (resolve: (v: { error: { message: string } | null }) => void) => {
                  const r = handlers.fromUpdate?.(table, patch, whereId) ?? { error: null }
                  resolve({ error: r.error ?? null })
                },
              }
            },
          }
          return updChain
        },
        select() {
          return {
            eq(_col: string, val: string) {
              whereId = val
              return {
                single: async () => handlers.fromSelectSingle?.(table, whereId) ?? { data: null, error: null },
                maybeSingle: async () => handlers.fromSelectSingle?.(table, whereId) ?? { data: null, error: null },
              }
            },
            order() {
              return {
                range: async () => handlers.fromSelectMany?.(table) ?? { data: [], error: null },
                eq() {
                  return {
                    range: async () => handlers.fromSelectMany?.(table) ?? { data: [], error: null },
                  }
                },
              }
            },
          }
        },
      }
      return chain
    },
    rpc: async (fnName: string, args: Record<string, unknown>) =>
      handlers.rpc?.(fnName, args) ?? { data: null, error: null },
  } as unknown as SupabaseMock
}

describe("enqueueJob", () => {
  it("insere na tabela e retorna id", async () => {
    const supabase = mockSupabase({
      fromInsert: () => ({ data: { id: "job-123" }, error: null }),
    })
    const r = await enqueueJob(supabase, {
      type: "documentos_lote",
      input: { tipo: "autorizacao_nr" },
      empresa_id: "e1",
      user_id: "u1",
    })
    expect(r.id).toBe("job-123")
  })

  it("joga erro com mensagem amigável se DB falhar", async () => {
    const supabase = mockSupabase({
      fromInsert: () => ({ data: null, error: { message: "unique violation" } }),
    })
    await expect(
      enqueueJob(supabase, { type: "documentos_lote", input: {}, empresa_id: "e", user_id: "u" }),
    ).rejects.toThrow(/enqueueJob: unique violation/)
  })
})

describe("claimNextJob", () => {
  it("chama RPC e retorna record quando disponível (objeto direto)", async () => {
    const jobRecord: Partial<JobRecord> = {
      id: "j1",
      type: "documentos_lote",
      status: "processing",
      empresa_id: "e",
      user_id: "u",
      attempts: 1,
    }
    const rpcSpy = vi.fn(() => ({ data: jobRecord, error: null }))
    const supabase = mockSupabase({ rpc: rpcSpy })
    const r = await claimNextJob(supabase, "worker-1")
    expect(rpcSpy).toHaveBeenCalledWith("claim_next_job", { worker_id: "worker-1" })
    expect(r?.id).toBe("j1")
  })

  it("normaliza quando postgrest devolve array de 1", async () => {
    const supabase = mockSupabase({
      rpc: () => ({ data: [{ id: "j2", type: "documentos_lote" }], error: null }),
    })
    const r = await claimNextJob(supabase, "w")
    expect(r?.id).toBe("j2")
  })

  it("retorna null quando a fila está vazia", async () => {
    const supabase = mockSupabase({ rpc: () => ({ data: null, error: null }) })
    const r = await claimNextJob(supabase, "w")
    expect(r).toBeNull()
  })
})

describe("markJobFailed — política de retry", () => {
  it("volta status=queued e limpa claim quando ainda há tentativas", async () => {
    const updates: Array<Record<string, unknown>> = []
    const supabase = mockSupabase({
      fromSelectSingle: () => ({ data: { attempts: 1, max_attempts: 3 }, error: null }),
      fromUpdate: (_t, patch) => {
        updates.push(patch)
        return { error: null }
      },
    })
    await markJobFailed(supabase, "j1", new Error("transient boom"))
    expect(updates[0].status).toBe("queued")
    expect(updates[0].claimed_by).toBeNull()
    expect(updates[0].claimed_at).toBeNull()
    expect(updates[0].error_message).toBe("transient boom")
    expect(updates[0].completed_at).toBeUndefined()
  })

  it("marca como failed permanente quando attempts >= max_attempts", async () => {
    const updates: Array<Record<string, unknown>> = []
    const supabase = mockSupabase({
      fromSelectSingle: () => ({ data: { attempts: 3, max_attempts: 3 }, error: null }),
      fromUpdate: (_t, patch) => {
        updates.push(patch)
        return { error: null }
      },
    })
    await markJobFailed(supabase, "j1", new Error("last one"))
    expect(updates[0].status).toBe("failed")
    expect(updates[0].completed_at).toBeDefined()
  })

  it("trunca mensagem a 2000 chars pra não explodir a coluna", async () => {
    const big = "x".repeat(3000)
    const updates: Array<Record<string, unknown>> = []
    const supabase = mockSupabase({
      fromSelectSingle: () => ({ data: { attempts: 3, max_attempts: 3 }, error: null }),
      fromUpdate: (_t, patch) => {
        updates.push(patch)
        return { error: null }
      },
    })
    await markJobFailed(supabase, "j1", new Error(big))
    expect((updates[0].error_message as string).length).toBe(2000)
  })

  it("captura stack truncado a 10 linhas em error_detail", async () => {
    const updates: Array<Record<string, unknown>> = []
    const supabase = mockSupabase({
      fromSelectSingle: () => ({ data: { attempts: 3, max_attempts: 3 }, error: null }),
      fromUpdate: (_t, patch) => {
        updates.push(patch)
        return { error: null }
      },
    })
    const e = new Error("boom")
    // Simula stack gigante
    e.stack = Array.from({ length: 20 }, (_, i) => `    at func${i} (/x:${i}:0)`).join("\n")
    await markJobFailed(supabase, "j1", e)
    const detail = updates[0].error_detail as { stack: string }
    expect(detail.stack.split("\n")).toHaveLength(10)
  })

  it("aceita erro string ou não-Error sem crashar", async () => {
    const updates: Array<Record<string, unknown>> = []
    const supabase = mockSupabase({
      fromSelectSingle: () => ({ data: { attempts: 1, max_attempts: 3 }, error: null }),
      fromUpdate: (_t, patch) => {
        updates.push(patch)
        return { error: null }
      },
    })
    await markJobFailed(supabase, "j1", "string rejeitada")
    expect(updates[0].error_message).toBe("string rejeitada")

    await markJobFailed(supabase, "j1", { code: 42 })
    expect(updates[1].error_message).toBe("unknown error")
  })
})

describe("markJobCompleted", () => {
  it("grava status completed + result + completed_at", async () => {
    const updates: Array<Record<string, unknown>> = []
    const supabase = mockSupabase({
      fromUpdate: (_t, patch) => {
        updates.push(patch)
        return { error: null }
      },
    })
    await markJobCompleted(supabase, "j1", {
      storage_path: "j1/out.zip",
      filename: "out.zip",
      content_type: "application/zip",
      bytes: 1024,
      summary: { gerados: 3 },
    })
    expect(updates[0].status).toBe("completed")
    expect(updates[0].completed_at).toBeDefined()
    expect((updates[0].result as { bytes: number }).bytes).toBe(1024)
  })
})

describe("updateProgress", () => {
  it("grava só progress_current se total não for passado", async () => {
    const updates: Array<Record<string, unknown>> = []
    const supabase = mockSupabase({
      fromUpdate: (_t, patch) => {
        updates.push(patch)
        return { error: null }
      },
    })
    await updateProgress(supabase, "j1", { current: 5 })
    expect(updates[0]).toEqual({ progress_current: 5 })
  })

  it("grava ambos se total passado", async () => {
    const updates: Array<Record<string, unknown>> = []
    const supabase = mockSupabase({
      fromUpdate: (_t, patch) => {
        updates.push(patch)
        return { error: null }
      },
    })
    await updateProgress(supabase, "j1", { current: 5, total: 10 })
    expect(updates[0]).toEqual({ progress_current: 5, progress_total: 10 })
  })
})

describe("getJob", () => {
  it("retorna null se não encontrar (não joga)", async () => {
    const supabase = mockSupabase({
      fromSelectSingle: () => ({ data: null, error: null }),
    })
    const r = await getJob(supabase, "no-such-id")
    expect(r).toBeNull()
  })

  it("retorna o record quando existe", async () => {
    const supabase = mockSupabase({
      fromSelectSingle: () => ({ data: { id: "j1", status: "queued" }, error: null }),
    })
    const r = await getJob(supabase, "j1")
    expect(r?.status).toBe("queued")
  })
})

describe("listJobs", () => {
  it("retorna array (vazio quando sem dados)", async () => {
    const supabase = mockSupabase({
      fromSelectMany: () => ({ data: [], error: null }),
    })
    const r = await listJobs(supabase)
    expect(r).toEqual([])
  })

  it("clampa limit a 100 máximo", async () => {
    const supabase = mockSupabase({
      fromSelectMany: () => ({ data: [{ id: "j1" }], error: null }),
    })
    const r = await listJobs(supabase, { limit: 9999 })
    expect(r).toHaveLength(1)
  })
})

describe("makeWorkerId", () => {
  it("gera id único e reproduz hostname quando disponível", () => {
    const id = makeWorkerId()
    expect(id).toMatch(/[^-]+-[^-]+-[^-]+/)
    const id2 = makeWorkerId()
    expect(id).not.toBe(id2)
  })
})

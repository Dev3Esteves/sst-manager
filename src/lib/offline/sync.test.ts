import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

type MutationState = {
  mutations: Record<number, {
    id: number
    type: string
    endpoint: string
    payload: unknown
    status: "pending" | "syncing" | "failed" | "poison"
    retryCount: number
    createdAt: number
    nextRetryAt?: number
  }>
  nextId: number
}

// Estado compartilhado entre o mock e os testes.
// Declarado antes do vi.mock — hoisting garante que o mock tem acesso.
const state: MutationState = { mutations: {}, nextId: 1 }

// Mock do módulo db.ts — isola syncAll da IndexedDB real
vi.mock("./db", () => ({
  listMutations: vi.fn(async (status?: string) => {
    const all = Object.values(state.mutations)
    return status ? all.filter((m) => m.status === status) : all
  }),
  markSyncing: vi.fn(async (id: number) => {
    if (state.mutations[id]) state.mutations[id].status = "syncing"
  }),
  markSynced: vi.fn(async (id: number) => {
    delete state.mutations[id]
  }),
  markFailed: vi.fn(async (id: number, error: string) => {
    const m = state.mutations[id]
    if (!m) return
    m.retryCount++
    m.status = m.retryCount >= 10 ? "poison" : "failed"
    m.nextRetryAt = Date.now() + 60_000
    ;(m as { lastError?: string }).lastError = error
  }),
  promoteReadyToRetry: vi.fn(async (now = Date.now()) => {
    let promoted = 0
    for (const m of Object.values(state.mutations)) {
      if (m.status === "failed" && (m.nextRetryAt === undefined || m.nextRetryAt <= now)) {
        m.status = "pending"
        m.nextRetryAt = undefined
        promoted++
      }
    }
    return promoted
  }),
}))

import { syncAll } from "./sync"

const origFetch = global.fetch

beforeEach(() => {
  // Reset state
  state.mutations = {}
  state.nextId = 1
  vi.clearAllMocks()
})

afterEach(() => {
  global.fetch = origFetch
})

function addMutation(
  endpoint: string,
  status: "pending" | "failed" = "pending",
  retryCount = 0,
  nextRetryAt?: number,
) {
  const id = state.nextId++
  state.mutations[id] = {
    id,
    type: "inspecao",
    endpoint,
    payload: { foo: "bar" },
    status,
    retryCount,
    createdAt: Date.now(),
    nextRetryAt,
  }
  return id
}

describe("syncAll — cenários de rede", () => {
  it("sucesso: todos os pending viram synced (deletados)", async () => {
    addMutation("/api/sync/a")
    addMutation("/api/sync/b")
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))

    const result = await syncAll()

    expect(result).toEqual({ total: 2, synced: 2, failed: 0, retried: 0 })
    expect(Object.keys(state.mutations)).toHaveLength(0)
  })

  it("HTTP 400 (cliente): item vira failed com retryCount++, não interrompe", async () => {
    addMutation("/api/sync/a") // 400
    addMutation("/api/sync/b") // 200
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response("payload inválido", { status: 400 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await syncAll()

    expect(result.synced).toBe(1)
    expect(result.failed).toBe(1)
    const failed = Object.values(state.mutations).find((m) => m.status === "failed")
    expect(failed).toBeDefined()
    expect(failed?.retryCount).toBe(1)
  })

  it("HTTP 500 (servidor): item vira failed e loop interrompe (evita cascata)", async () => {
    addMutation("/api/sync/a")
    addMutation("/api/sync/b")
    const fetchSpy = vi.fn().mockResolvedValue(new Response("down", { status: 503 }))
    global.fetch = fetchSpy

    const result = await syncAll()

    expect(result.synced).toBe(0)
    expect(result.failed).toBe(1) // só o primeiro foi tentado
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("erro de rede: item vira failed e loop interrompe", async () => {
    addMutation("/api/sync/a")
    addMutation("/api/sync/b")
    const fetchSpy = vi.fn().mockRejectedValue(new Error("Network error"))
    global.fetch = fetchSpy

    const result = await syncAll()

    expect(result.failed).toBe(1)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const failed = Object.values(state.mutations).find((m) => m.status === "failed")
    expect(failed?.retryCount).toBe(1)
  })

  it("failed com nextRetryAt no passado: é promovido e re-processado", async () => {
    addMutation("/api/sync/a", "failed", 1, Date.now() - 1000) // expirou
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))

    const result = await syncAll()

    expect(result.retried).toBe(1)
    expect(result.synced).toBe(1)
  })

  it("failed com nextRetryAt no futuro: NÃO é promovido (backoff respeitado)", async () => {
    addMutation("/api/sync/a", "failed", 1, Date.now() + 60_000)
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    global.fetch = fetchSpy

    const result = await syncAll()

    expect(result.retried).toBe(0)
    expect(result.total).toBe(0)
    expect(fetchSpy).not.toHaveBeenCalled()
    // Item continua em failed
    expect(state.mutations[1].status).toBe("failed")
  })

  it("mistura: 2 pending + 1 failed-expirado + 1 failed-futuro", async () => {
    addMutation("/api/sync/1") // pending
    addMutation("/api/sync/2") // pending
    addMutation("/api/sync/3", "failed", 2, Date.now() - 5000) // expirou — deve retentar
    addMutation("/api/sync/4", "failed", 1, Date.now() + 60_000) // futuro — não mexe
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))

    const result = await syncAll()

    expect(result.retried).toBe(1)
    expect(result.synced).toBe(3) // 2 pendings + 1 failed promovido
    expect(state.mutations[4].status).toBe("failed") // intocado
  })

  it("ordem FIFO: processa createdAt crescente", async () => {
    const now = Date.now()
    const id1 = state.nextId++
    state.mutations[id1] = { id: id1, type: "inspecao", endpoint: "/a", payload: {}, status: "pending", retryCount: 0, createdAt: now + 100 }
    const id2 = state.nextId++
    state.mutations[id2] = { id: id2, type: "inspecao", endpoint: "/b", payload: {}, status: "pending", retryCount: 0, createdAt: now }

    const endpoints: string[] = []
    global.fetch = vi.fn().mockImplementation((url: string) => {
      endpoints.push(url)
      return Promise.resolve(new Response(null, { status: 200 }))
    })

    await syncAll()

    expect(endpoints).toEqual(["/b", "/a"]) // mais antigo primeiro
  })
})

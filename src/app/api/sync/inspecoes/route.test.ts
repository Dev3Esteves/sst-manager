/**
 * Testes de integração do POST /api/sync/inspecoes.
 *
 * Mockamos `@/lib/auth/guards` e `@/lib/supabase/server` para isolar a
 * rota do backend real — é suficiente para cobrir os caminhos de decisão
 * (payload inválido, não autenticado, erro do banco, sucesso).
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AuthError } from "@/lib/auth/guards"

const authState: { shouldFail: "none" | "unauth"; user: { id: string } | null } = {
  shouldFail: "none",
  user: { id: "user-1" },
}

const dbState: {
  insertShouldFail: boolean
  insertedPayload: Record<string, unknown> | null
  colaboradorVinculado: string | null
} = {
  insertShouldFail: false,
  insertedPayload: null,
  colaboradorVinculado: "colab-1",
}

vi.mock("@/lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/guards")>("@/lib/auth/guards")
  return {
    ...actual,
    requireAuth: async () => {
      if (authState.shouldFail === "unauth") {
        throw new actual.AuthError("Não autenticado", "UNAUTHENTICATED")
      }
      // Supabase fake com o shape mínimo usado pela rota
      const supabase = {
        from(table: string) {
          return {
            select() {
              return {
                eq() {
                  return {
                    single: async () => ({
                      data: table === "usuarios"
                        ? { colaborador_id: dbState.colaboradorVinculado }
                        : null,
                    }),
                  }
                },
              }
            },
            insert(payload: Record<string, unknown>) {
              dbState.insertedPayload = payload
              return {
                select() {
                  return {
                    single: async () => dbState.insertShouldFail
                      ? { data: null, error: { message: "DB down" } }
                      : { data: { id: "inspecao-123" }, error: null },
                  }
                },
              }
            },
          }
        },
      }
      return { supabase, user: authState.user!, perfil: "admin" as const }
    },
  }
})

// Import da rota APÓS os mocks
import { POST } from "./route"

beforeEach(() => {
  authState.shouldFail = "none"
  authState.user = { id: "user-1" }
  dbState.insertShouldFail = false
  dbState.insertedPayload = null
  dbState.colaboradorVinculado = "colab-1"
})

function req(body: unknown): Request {
  return new Request("http://test/api/sync/inspecoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const payloadValido = {
  template_id: "00000000-0000-4000-8000-000000000001",
  empresa_id: "00000000-0000-4000-8000-000000000002",
  local: "Subestação Principal",
  data_inspecao: "2026-04-20T10:00:00Z",
  respostas: [
    { item_index: 0, pergunta: "EPIs OK?", conforme: "sim" },
    { item_index: 1, pergunta: "Sinalização?", conforme: "nao" },
  ],
}

describe("POST /api/sync/inspecoes", () => {
  it("retorna 201 com id da inspeção e percentual calculado", async () => {
    const res = await POST(req(payloadValido))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe("inspecao-123")
    expect(json.percentual).toBe(50) // 1 sim / 2 = 50%
  })

  it("insere com inspetor_id vinculado ao colaborador do usuário logado", async () => {
    await POST(req(payloadValido))
    expect(dbState.insertedPayload?.inspetor_id).toBe("colab-1")
    expect(dbState.insertedPayload?.empresa_id).toBe(payloadValido.empresa_id)
    expect(dbState.insertedPayload?.status).toBe("concluida")
  })

  it("retorna 400 com payload inválido (faltando template_id)", async () => {
    const invalid = { ...payloadValido, template_id: undefined }
    const res = await POST(req(invalid))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
    expect(json.issues).toBeDefined()
  })

  it("retorna 400 se respostas estiverem vazias", async () => {
    const res = await POST(req({ ...payloadValido, respostas: [] }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/pelo menos um/)
  })

  it("retorna 400 para body não-JSON", async () => {
    const badReq = new Request("http://test/api/sync/inspecoes", {
      method: "POST",
      body: "{ nao é json ",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(badReq)
    expect(res.status).toBe(400)
  })

  it("retorna 401 quando não autenticado", async () => {
    authState.shouldFail = "unauth"
    const res = await POST(req(payloadValido))
    expect(res.status).toBe(401)
  })

  it("retorna 500 quando insert no DB falha", async () => {
    dbState.insertShouldFail = true
    const res = await POST(req(payloadValido))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe("DB down")
  })

  it("inspetor_id customizado no payload sobrescreve o link do usuário", async () => {
    const payloadComInspetor = {
      ...payloadValido,
      inspetor_id: "00000000-0000-4000-8000-00000000abcd",
    }
    await POST(req(payloadComInspetor))
    expect(dbState.insertedPayload?.inspetor_id).toBe("00000000-0000-4000-8000-00000000abcd")
  })

  it("sem colaborador vinculado, inspetor_id fica null", async () => {
    dbState.colaboradorVinculado = null
    await POST(req(payloadValido))
    expect(dbState.insertedPayload?.inspetor_id).toBeNull()
  })

  it("percentual 100 quando todas as respostas são sim ou na", async () => {
    const res = await POST(req({
      ...payloadValido,
      respostas: [
        { item_index: 0, pergunta: "A", conforme: "sim" },
        { item_index: 1, pergunta: "B", conforme: "na" },
        { item_index: 2, pergunta: "C", conforme: "sim" },
      ],
    }))
    const json = await res.json()
    expect(json.percentual).toBe(100)
  })

  // Evita warnings sobre AuthError não sendo usado
  it("sanity check — AuthError importável para mock", () => {
    expect(new AuthError("x", "UNAUTHENTICATED")).toBeInstanceOf(Error)
  })
})

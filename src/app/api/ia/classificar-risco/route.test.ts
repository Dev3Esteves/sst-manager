/**
 * Teste de integração do POST /api/ia/classificar-risco.
 *
 * Mocka `classificarRisco` (para não bater na API real da Anthropic) e
 * `requireAuth` (para isolar do Supabase). Valida os 4 caminhos:
 * auth, validação Zod, IAServiceUnavailable e erro genérico.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const authState = { authenticated: true }

const iaState: {
  behavior: "success" | "unavailable" | "error"
  result: Record<string, unknown>
  errorMessage: string
} = {
  behavior: "success",
  result: {
    probabilidade: 4,
    severidade: 4,
    consequencia: "Choque elétrico com lesão",
    medida_controle: "Desenergizar conforme NR-10",
  },
  errorMessage: "Limite atingido",
}

vi.mock("@/lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/guards")>("@/lib/auth/guards")
  return {
    ...actual,
    requireAuth: async () => {
      if (!authState.authenticated) {
        throw new actual.AuthError("Não autenticado", "UNAUTHENTICATED")
      }
      return { supabase: {} as unknown, user: { id: "u1" }, perfil: "admin" as const }
    },
  }
})

// Mock do próprio classificar-risco service para não chamar API externa
vi.mock("@/lib/ia/classificar-risco", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ia/classificar-risco")>("@/lib/ia/classificar-risco")
  return {
    ...actual,
    classificarRisco: async () => {
      if (iaState.behavior === "unavailable") {
        throw new actual.IAServiceUnavailable()
      }
      if (iaState.behavior === "error") {
        throw new Error(iaState.errorMessage)
      }
      return iaState.result
    },
  }
})

import { POST } from "./route"

beforeEach(() => {
  authState.authenticated = true
  iaState.behavior = "success"
})

function req(body: unknown) {
  return new Request("http://test/api/ia/classificar-risco", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const payloadValido = {
  atividade: "Manutenção em painel elétrico de MT",
  perigo: "Contato direto com parte energizada",
}

describe("POST /api/ia/classificar-risco", () => {
  it("retorna 401 quando não autenticado", async () => {
    authState.authenticated = false
    const res = await POST(req(payloadValido))
    expect(res.status).toBe(401)
  })

  it("retorna 200 com o resultado quando tudo OK", async () => {
    const res = await POST(req(payloadValido))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.probabilidade).toBe(4)
    expect(json.severidade).toBe(4)
    expect(json.medida_controle).toContain("NR-10")
  })

  it("retorna 400 para atividade curta demais (Zod)", async () => {
    const res = await POST(req({ atividade: "ab", perigo: "Risco mínimo aceitável" }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/atividade/i)
  })

  it("retorna 400 para perigo vazio", async () => {
    const res = await POST(req({ atividade: "Manutenção x", perigo: "" }))
    expect(res.status).toBe(400)
  })

  it("retorna 503 quando ANTHROPIC_API_KEY não configurada (IAServiceUnavailable)", async () => {
    iaState.behavior = "unavailable"
    const res = await POST(req(payloadValido))
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toBe("IA não configurada")
    expect(json.detail).toContain("ANTHROPIC_API_KEY")
  })

  it("retorna 500 com mensagem do erro quando o SDK falha", async () => {
    iaState.behavior = "error"
    iaState.errorMessage = "Timeout da Claude API"
    const res = await POST(req(payloadValido))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe("Timeout da Claude API")
  })

  it("retorna 400 para body não-JSON (null após parse)", async () => {
    const bad = new Request("http://test/api/ia/classificar-risco", {
      method: "POST",
      body: "lixo",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(bad)
    expect(res.status).toBe(400)
  })
})

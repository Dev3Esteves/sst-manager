/**
 * Testes das Server Actions de configuração (trocarSenha / salvarTemplateCertificado).
 *
 * Diferente das actions de cadastro, estas USAM os guards (requireAuth /
 * requireAdmin). Mockamos os guards para retornar o fake client e cobrir:
 * sucesso, validação, erro de auth/DB e bloqueio por falta de papel.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AuthError } from "@/lib/auth/guards"
import { freshState, buildFakeClient, type FakeState } from "@/test/fake-supabase"

const state = vi.hoisted(
  (): FakeState => ({
    result: { data: null, error: null },
    uploadError: null,
    authError: null,
    calls: { table: null, op: null, payload: null, eq: null, uploads: [], authUpdate: null },
  }),
)

const guardState = vi.hoisted(() => ({ authFail: false, adminFail: false }))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/guards")>("@/lib/auth/guards")
  const { buildFakeClient } = await import("@/test/fake-supabase")
  return {
    ...actual,
    requireAuth: async () => {
      if (guardState.authFail) throw new actual.AuthError("Não autenticado", "UNAUTHENTICATED")
      return { supabase: buildFakeClient(state), user: { id: "u1" }, perfil: "admin" as const }
    },
    requireAdmin: async () => {
      if (guardState.adminFail) throw new actual.AuthError("Apenas administradores", "FORBIDDEN")
      return { supabase: buildFakeClient(state), user: { id: "u1" }, perfil: "admin" as const }
    },
  }
})

import { trocarSenha, salvarTemplateCertificado } from "./actions"

function fd(fields: Record<string, string>): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.set(k, v)
  return form
}

beforeEach(() => {
  Object.assign(state, freshState())
  guardState.authFail = false
  guardState.adminFail = false
})

describe("trocarSenha", () => {
  it("caso nominal: chama auth.updateUser com a nova senha e retorna ok", async () => {
    const result = await trocarSenha(fd({ senha: "senhaForte123", confirmacao: "senhaForte123" }))
    expect(result).toEqual({ ok: true })
    expect(state.calls.authUpdate).toEqual({ password: "senhaForte123" })
  })

  it("validação: senha curta retorna fieldErrors sem chamar auth", async () => {
    const result = await trocarSenha(fd({ senha: "123", confirmacao: "123" }))
    expect("error" in result && result.error).toHaveProperty("senha")
    expect(state.calls.authUpdate).toBeNull()
  })

  it("validação: confirmação divergente é rejeitada", async () => {
    const result = await trocarSenha(fd({ senha: "senhaForte123", confirmacao: "outraCoisa999" }))
    expect("error" in result && result.error).toHaveProperty("confirmacao")
    expect(state.calls.authUpdate).toBeNull()
  })

  it("não autenticado: retorna erro de sessão sem chamar auth", async () => {
    guardState.authFail = true
    const result = await trocarSenha(fd({ senha: "senhaForte123", confirmacao: "senhaForte123" }))
    expect("error" in result && result.error._form?.[0]).toMatch(/Sessão expirada/)
    expect(state.calls.authUpdate).toBeNull()
  })

  it("erro do Supabase Auth é propagado em _form", async () => {
    state.authError = { message: "password too weak" }
    const result = await trocarSenha(fd({ senha: "senhaForte123", confirmacao: "senhaForte123" }))
    expect("error" in result && result.error._form).toEqual(["password too weak"])
  })
})

describe("salvarTemplateCertificado", () => {
  it("caso nominal: faz update na empresa e retorna ok", async () => {
    const result = await salvarTemplateCertificado("emp-1", fd({ template_certificado: "Olá {{aluno_nome}}" }))
    expect(result).toEqual({ ok: true })
    expect(state.calls.table).toBe("empresas")
    expect(state.calls.op).toBe("update")
    expect(state.calls.eq).toEqual(["id", "emp-1"])
    expect(state.calls.payload).toEqual({ template_certificado: "Olá {{aluno_nome}}" })
  })

  it("template vazio vira null (volta ao padrão do sistema)", async () => {
    const result = await salvarTemplateCertificado("emp-1", fd({ template_certificado: "   " }))
    expect(result).toEqual({ ok: true })
    expect(state.calls.payload).toEqual({ template_certificado: null })
  })

  it("não-admin: bloqueia sem tocar o banco", async () => {
    guardState.adminFail = true
    const result = await salvarTemplateCertificado("emp-1", fd({ template_certificado: "x" }))
    expect("error" in result && result.error._form?.[0]).toMatch(/administradores/)
    expect(state.calls.table).toBeNull()
  })

  it("erro de DB é propagado em _form", async () => {
    state.result = { data: null, error: { message: "update falhou" } }
    const result = await salvarTemplateCertificado("emp-1", fd({ template_certificado: "x" }))
    expect("error" in result && result.error._form).toEqual(["update falhou"])
  })

  // Mantém o import de AuthError/buildFakeClient "usado" e validável
  it("sanity: helpers de teste importáveis", () => {
    expect(new AuthError("x", "FORBIDDEN")).toBeInstanceOf(Error)
    expect(typeof buildFakeClient).toBe("function")
  })
})

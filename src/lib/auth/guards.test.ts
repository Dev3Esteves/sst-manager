import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock do createClient — um builder simples que permite controlar a resposta
// do getUser() e do rpc() entre testes.
const mockState: {
  user: { id: string } | null
  perfilNome: string | null
} = { user: null, perfilNome: null }

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: mockState.user } }),
    },
    rpc: async (name: string) => {
      if (name === "user_perfil_nome") return { data: mockState.perfilNome }
      return { data: null }
    },
  }),
}))

import {
  getAuth, getAuthWithRole, requireAuth, requireRole, requireAdmin, AuthError,
} from "./guards"

beforeEach(() => {
  mockState.user = null
  mockState.perfilNome = null
})

describe("getAuth", () => {
  it("retorna null quando não há usuário", async () => {
    const ctx = await getAuth()
    expect(ctx).toBeNull()
  })

  it("retorna contexto com perfil quando autenticado", async () => {
    mockState.user = { id: "user-1" }
    mockState.perfilNome = "admin"
    const ctx = await getAuth()
    expect(ctx).not.toBeNull()
    expect(ctx!.user.id).toBe("user-1")
    expect(ctx!.perfil).toBe("admin")
    expect(ctx!.supabase).toBeDefined()
  })

  it("retorna perfil=null quando autenticado mas sem vínculo em usuarios", async () => {
    mockState.user = { id: "user-1" }
    mockState.perfilNome = null
    const ctx = await getAuth()
    expect(ctx).not.toBeNull()
    expect(ctx!.perfil).toBeNull()
  })

  it("filtra perfil desconhecido (não está em PERFIS) como null", async () => {
    mockState.user = { id: "user-1" }
    mockState.perfilNome = "hacker_escalation"
    const ctx = await getAuth()
    expect(ctx!.perfil).toBeNull()
  })
})

describe("getAuthWithRole", () => {
  it("retorna null sem autenticação", async () => {
    expect(await getAuthWithRole(["admin"])).toBeNull()
  })

  it("retorna null com perfil fora da lista", async () => {
    mockState.user = { id: "u" }
    mockState.perfilNome = "tec_seguranca"
    expect(await getAuthWithRole(["admin"])).toBeNull()
  })

  it("retorna contexto quando perfil está na lista", async () => {
    mockState.user = { id: "u" }
    mockState.perfilNome = "admin"
    const ctx = await getAuthWithRole(["admin", "engenheiro_seg"])
    expect(ctx).not.toBeNull()
    expect(ctx!.perfil).toBe("admin")
  })
})

describe("requireAuth", () => {
  it("lança AuthError UNAUTHENTICATED sem sessão", async () => {
    await expect(requireAuth()).rejects.toThrow(AuthError)
    try {
      await requireAuth()
    } catch (e) {
      expect(e).toBeInstanceOf(AuthError)
      expect((e as AuthError).code).toBe("UNAUTHENTICATED")
    }
  })

  it("retorna contexto quando autenticado", async () => {
    mockState.user = { id: "user-1" }
    mockState.perfilNome = "admin"
    const ctx = await requireAuth()
    expect(ctx.user.id).toBe("user-1")
  })
})

describe("requireRole", () => {
  it("lança UNAUTHENTICATED se sem sessão", async () => {
    await expect(requireRole(["admin"])).rejects.toThrow("Não autenticado")
  })

  it("lança FORBIDDEN se perfil não está na lista", async () => {
    mockState.user = { id: "u" }
    mockState.perfilNome = "tec_seguranca"
    try {
      await requireRole(["admin"])
      throw new Error("não deveria chegar aqui")
    } catch (e) {
      expect((e as AuthError).code).toBe("FORBIDDEN")
    }
  })

  it("passa quando perfil está na lista", async () => {
    mockState.user = { id: "u" }
    mockState.perfilNome = "tec_seguranca"
    const ctx = await requireRole(["admin", "tec_seguranca"])
    expect(ctx.perfil).toBe("tec_seguranca")
  })

  it("usa mensagem customizada quando fornecida", async () => {
    mockState.user = { id: "u" }
    mockState.perfilNome = "colaborador"
    await expect(requireRole(["admin"], { mensagem: "X customizada" }))
      .rejects.toThrow("X customizada")
  })
})

describe("requireAdmin", () => {
  it("passa só para perfil admin", async () => {
    mockState.user = { id: "u" }
    mockState.perfilNome = "admin"
    const ctx = await requireAdmin()
    expect(ctx.perfil).toBe("admin")
  })

  it("rejeita outros perfis com FORBIDDEN", async () => {
    mockState.user = { id: "u" }
    mockState.perfilNome = "engenheiro_seg"
    try {
      await requireAdmin()
    } catch (e) {
      expect((e as AuthError).code).toBe("FORBIDDEN")
      expect((e as AuthError).message).toContain("Apenas administradores")
    }
  })
})

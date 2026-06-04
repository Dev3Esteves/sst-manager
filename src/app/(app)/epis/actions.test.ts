/**
 * Testes das Server Actions de EPIs (createEpi / updateEpi).
 * Ver nota de segurança em empresas/actions.test.ts — proteção via RLS.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { freshState, type FakeState } from "@/test/fake-supabase"

const state = vi.hoisted(
  (): FakeState => ({
    result: { data: null, error: null },
    uploadError: null,
    authError: null,
    calls: { table: null, op: null, payload: null, eq: null, uploads: [], authUpdate: null },
  }),
)

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const { buildFakeClient } = await import("@/test/fake-supabase")
    return buildFakeClient(state)
  },
}))

import { createEpi, updateEpi } from "./actions"

function fd(fields: Record<string, string>): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.set(k, v)
  return form
}

const camposValidos = {
  descricao: "Capacete de segurança classe B",
  ca: "12345",
  tipo: "capacete",
  fabricante: "3M",
}

beforeEach(() => {
  Object.assign(state, freshState())
})

describe("createEpi", () => {
  it("caso nominal: insere em epis e redireciona", async () => {
    await expect(createEpi(fd(camposValidos))).rejects.toThrow("NEXT_REDIRECT:/epis")
    expect(state.calls.table).toBe("epis")
    expect(state.calls.op).toBe("insert")
    const payload = state.calls.payload as Record<string, unknown>
    expect(payload.descricao).toBe("Capacete de segurança classe B")
    expect(payload.ca).toBe("12345")
  })

  it("validação: descrição curta retorna fieldErrors sem tocar o banco", async () => {
    const result = await createEpi(fd({ ...camposValidos, descricao: "x" }))
    expect(result?.error).toHaveProperty("descricao")
    expect(state.calls.table).toBeNull()
  })

  it("validação: CA vazio é rejeitado", async () => {
    const result = await createEpi(fd({ ...camposValidos, ca: "" }))
    expect(result?.error).toHaveProperty("ca")
  })

  it("erro de DB retorna { error: { _form } }", async () => {
    state.result = { data: null, error: { message: "CA duplicado" } }
    const result = await createEpi(fd(camposValidos))
    expect(result?.error).toEqual({ _form: ["CA duplicado"] })
  })
})

describe("updateEpi", () => {
  it("caso nominal: atualiza pelo id e redireciona", async () => {
    await expect(updateEpi("epi-3", fd(camposValidos))).rejects.toThrow("NEXT_REDIRECT:/epis")
    expect(state.calls.op).toBe("update")
    expect(state.calls.eq).toEqual(["id", "epi-3"])
  })

  it("erro de DB no update retorna { error }", async () => {
    state.result = { data: null, error: { message: "falhou" } }
    const result = await updateEpi("epi-3", fd(camposValidos))
    expect(result?.error).toEqual({ _form: ["falhou"] })
  })
})

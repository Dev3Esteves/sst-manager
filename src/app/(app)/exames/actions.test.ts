/**
 * Testes da Server Action de exames médicos (createExame).
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

import { createExame } from "./actions"

function fd(fields: Record<string, string>): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.set(k, v)
  return form
}

const camposValidos = {
  colaborador_id: "00000000-0000-4000-8000-000000000001",
  tipo: "periodico",
  data_realizacao: "2026-01-10",
  data_vencimento: "2027-01-10",
  resultado: "apto",
  medico_nome: "Dra. Ana",
  crm: "CRM-SP 12345",
}

beforeEach(() => {
  Object.assign(state, freshState())
})

describe("createExame", () => {
  it("caso nominal: insere em exames_medicos e redireciona para /exames", async () => {
    await expect(createExame(fd(camposValidos))).rejects.toThrow("NEXT_REDIRECT:/exames")
    expect(state.calls.table).toBe("exames_medicos")
    expect(state.calls.op).toBe("insert")
    const payload = state.calls.payload as Record<string, unknown>
    expect(payload.colaborador_id).toBe(camposValidos.colaborador_id)
    expect(payload.tipo).toBe("periodico")
    expect(payload.resultado).toBe("apto")
  })

  it("campos opcionais vazios viram null no payload", async () => {
    const form = fd({ ...camposValidos, resultado: "", crm: "", medico_nome: "" })
    await expect(createExame(form)).rejects.toThrow("NEXT_REDIRECT")
    const payload = state.calls.payload as Record<string, unknown>
    expect(payload.resultado).toBeNull()
    expect(payload.crm).toBeNull()
  })

  it("validação: colaborador_id não-uuid retorna fieldErrors sem tocar o banco", async () => {
    const result = await createExame(fd({ ...camposValidos, colaborador_id: "abc" }))
    expect(result?.error).toHaveProperty("colaborador_id")
    expect(state.calls.table).toBeNull()
  })

  it("validação: tipo inválido é rejeitado", async () => {
    const result = await createExame(fd({ ...camposValidos, tipo: "inexistente" }))
    expect(result?.error).toHaveProperty("tipo")
  })

  it("erro de DB retorna { error: { _form } }", async () => {
    state.result = { data: null, error: { message: "FK violada" } }
    const result = await createExame(fd(camposValidos))
    expect(result?.error).toEqual({ _form: ["FK violada"] })
  })
})

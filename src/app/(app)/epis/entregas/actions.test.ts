/**
 * Testes da Server Action de entrega de EPI (createEntrega).
 * Recebe um objeto (não FormData) e, opcionalmente, faz upload da assinatura
 * em base64 para o bucket `assinaturas`. Ver nota de segurança em
 * empresas/actions.test.ts — proteção via RLS.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { freshState, type FakeState } from "@/test/fake-supabase"
import type { EpiEntregaInput } from "@/lib/validations/epi-entrega"

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

import { createEntrega } from "./actions"

const payloadValido: EpiEntregaInput = {
  colaborador_id: "00000000-0000-4000-8000-000000000001",
  epi_id: "00000000-0000-4000-8000-000000000002",
  data_entrega: "2026-03-01",
  quantidade: 2,
  motivo: "primeiro_fornecimento",
  observacoes: null,
  assinatura_data_url: null,
}

beforeEach(() => {
  Object.assign(state, freshState())
})

describe("createEntrega", () => {
  it("caso nominal sem assinatura: insere com assinatura_url null e redireciona", async () => {
    await expect(createEntrega(payloadValido)).rejects.toThrow("NEXT_REDIRECT:/epis/entregas")
    expect(state.calls.table).toBe("epi_entregas")
    expect(state.calls.op).toBe("insert")
    const payload = state.calls.payload as Record<string, unknown>
    expect(payload.colaborador_id).toBe(payloadValido.colaborador_id)
    expect(payload.quantidade).toBe(2)
    expect(payload.assinatura_url).toBeNull()
    expect(state.calls.uploads).toHaveLength(0)
  })

  it("com assinatura base64: faz upload e grava o path em assinatura_url", async () => {
    const comAssinatura: EpiEntregaInput = {
      ...payloadValido,
      assinatura_data_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
    }
    await expect(createEntrega(comAssinatura)).rejects.toThrow("NEXT_REDIRECT")
    expect(state.calls.uploads).toHaveLength(1)
    expect(state.calls.uploads[0]).toMatch(/^epi-00000000-0000-4000-8000-000000000001\/\d+\.png$/)
    const payload = state.calls.payload as Record<string, unknown>
    expect(payload.assinatura_url).toBe(state.calls.uploads[0])
  })

  it("falha no upload da assinatura não impede a entrega (assinatura_url fica null)", async () => {
    state.uploadError = { message: "storage indisponível" }
    const comAssinatura: EpiEntregaInput = {
      ...payloadValido,
      assinatura_data_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
    }
    await expect(createEntrega(comAssinatura)).rejects.toThrow("NEXT_REDIRECT")
    const payload = state.calls.payload as Record<string, unknown>
    expect(payload.assinatura_url).toBeNull()
  })

  it("validação: motivo inválido retorna { error } sem tocar o banco", async () => {
    const result = await createEntrega({
      ...payloadValido,
      motivo: "motivo_inexistente" as unknown as EpiEntregaInput["motivo"],
    })
    expect(result?.error).toBeDefined()
    expect(state.calls.table).toBeNull()
  })

  it("validação: colaborador_id não-uuid é rejeitado", async () => {
    const result = await createEntrega({ ...payloadValido, colaborador_id: "xyz" })
    expect(result?.error).toBeDefined()
    expect(state.calls.op).toBeNull()
  })

  it("erro de DB no insert retorna { error: { _form } }", async () => {
    state.result = { data: null, error: { message: "constraint violada" } }
    const result = await createEntrega(payloadValido)
    expect(result?.error).toEqual({ _form: ["constraint violada"] })
  })
})

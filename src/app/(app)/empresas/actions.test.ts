/**
 * Testes das Server Actions de empresas (createEmpresa / updateEmpresa).
 *
 * Modelo Parceiro de Negócio (Fase 2): a action valida o payload JSON
 * (empresaFormSchema) e delega a escrita à RPC transacional `empresa_bp_salvar`.
 * Mockamos next/cache, next/navigation e o client Supabase (incl. `rpc`) para
 * cobrir os caminhos: sucesso (chega ao redirect), validação Zod (retorna
 * fieldErrors sem chamar a RPC) e erro de banco.
 *
 * Nota: a regra "própria não tem empresa_mãe" e a atomicidade são responsabilidade
 * da RPC (validadas no nível do banco), não da action.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { freshState, type FakeState } from "@/test/fake-supabase"

const state = vi.hoisted(
  (): FakeState => ({
    result: { data: null, error: null },
    uploadError: null,
    authError: null,
    calls: { table: null, op: null, payload: null, eq: null, uploads: [], authUpdate: null, rpc: null },
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

import { createEmpresa, updateEmpresa } from "./actions"

const CNPJ_VALIDO = "11222333000181"

const payloadValido = {
  razao_social: "Acme Engenharia Ltda",
  cnpj: CNPJ_VALIDO,
  propria: true,
  ativo: true,
  papeis: ["propria"],
}

/** Monta um FormData com o payload JSON (campo `payload`), como o form faz. */
function fdPayload(extra: Record<string, unknown> = {}): FormData {
  const form = new FormData()
  form.set("payload", JSON.stringify({ ...payloadValido, ...extra }))
  return form
}

beforeEach(() => {
  Object.assign(state, freshState())
})

describe("createEmpresa", () => {
  it("caso nominal: chama a RPC com p_id null e redireciona", async () => {
    state.result = { data: "emp-1", error: null }
    await expect(createEmpresa(fdPayload())).rejects.toThrow("NEXT_REDIRECT:/empresas")
    expect(state.calls.rpc?.fn).toBe("empresa_bp_salvar")
    const args = state.calls.rpc?.args as { p_id: unknown; p_payload: Record<string, unknown> }
    expect(args.p_id).toBeNull()
    expect(args.p_payload.razao_social).toBe("Acme Engenharia Ltda")
    expect(args.p_payload.cnpj).toBe(CNPJ_VALIDO)
    expect(args.p_payload.propria).toBe(true)
    expect(args.p_payload.papeis).toEqual(["propria"])
  })

  it("encaminha o payload (incl. propria) para a RPC", async () => {
    state.result = { data: "emp-1", error: null }
    const form = fdPayload({ empresa_mae_id: "00000000-0000-4000-8000-000000000099" })
    await expect(createEmpresa(form)).rejects.toThrow("NEXT_REDIRECT")
    const args = state.calls.rpc?.args as { p_payload: Record<string, unknown> }
    expect(args.p_payload.propria).toBe(true)
  })

  it("validação: razão social curta retorna fieldErrors e não chama a RPC", async () => {
    const result = await createEmpresa(fdPayload({ razao_social: "AB" }))
    expect(result?.error).toBeDefined()
    expect(result?.error).toHaveProperty("razao_social")
    expect(state.calls.rpc).toBeNull()
  })

  it("validação: CNPJ inválido é rejeitado", async () => {
    const result = await createEmpresa(fdPayload({ cnpj: "11222333000180" }))
    expect(result?.error).toHaveProperty("cnpj")
    expect(state.calls.rpc).toBeNull()
  })

  it("validação: sem papéis retorna fieldErrors", async () => {
    const result = await createEmpresa(fdPayload({ papeis: [] }))
    expect(result?.error).toHaveProperty("papeis")
    expect(state.calls.rpc).toBeNull()
  })

  it("erro de DB: retorna { error: { _form } } sem redirecionar", async () => {
    state.result = { data: null, error: { message: "duplicate key" } }
    const result = await createEmpresa(fdPayload())
    expect(result?.error).toEqual({ _form: ["duplicate key"] })
  })
})

describe("updateEmpresa", () => {
  it("caso nominal: chama a RPC com o id e redireciona", async () => {
    state.result = { data: "emp-7", error: null }
    await expect(updateEmpresa("emp-7", fdPayload())).rejects.toThrow("NEXT_REDIRECT:/empresas")
    expect(state.calls.rpc?.fn).toBe("empresa_bp_salvar")
    const args = state.calls.rpc?.args as { p_id: unknown }
    expect(args.p_id).toBe("emp-7")
  })

  it("erro de DB no update retorna { error }", async () => {
    state.result = { data: null, error: { message: "update falhou" } }
    const result = await updateEmpresa("emp-7", fdPayload())
    expect(result?.error).toEqual({ _form: ["update falhou"] })
  })
})

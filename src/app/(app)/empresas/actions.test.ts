/**
 * Testes das Server Actions de empresas (createEmpresa / updateEmpresa).
 *
 * Mockamos next/cache, next/navigation e o client Supabase para isolar a
 * action e cobrir os caminhos de decisão: sucesso (chega ao redirect),
 * validação Zod (retorna fieldErrors sem tocar o banco) e erro de DB.
 *
 * Nota de segurança: estas actions não chamam guards de auth — a proteção
 * é o RLS por empresa no Postgres. Por isso não há caso "forbidden" aqui;
 * autorização é coberta no nível do banco, não da action.
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

import { createEmpresa, updateEmpresa } from "./actions"

const CNPJ_VALIDO = "11222333000181"

function fd(fields: Record<string, string>): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.set(k, v)
  return form
}

const camposValidos = {
  razao_social: "Acme Engenharia Ltda",
  cnpj: CNPJ_VALIDO,
  tipo: "propria",
  dona_sistema: "on",
  ativo: "on",
}

beforeEach(() => {
  Object.assign(state, freshState())
})

describe("createEmpresa", () => {
  it("caso nominal: insere e redireciona para /empresas", async () => {
    state.result = { data: { id: "emp-1" }, error: null }
    await expect(createEmpresa(fd(camposValidos))).rejects.toThrow("NEXT_REDIRECT:/empresas")
    expect(state.calls.table).toBe("empresas")
    expect(state.calls.op).toBe("insert")
    const payload = state.calls.payload as Record<string, unknown>
    expect(payload.razao_social).toBe("Acme Engenharia Ltda")
    expect(payload.cnpj).toBe(CNPJ_VALIDO)
    expect(payload.tipo).toBe("propria")
    expect(payload.dona_sistema).toBe(true)
  })

  it("dona do sistema força empresa_mae_id = null mesmo se enviado", async () => {
    state.result = { data: { id: "emp-1" }, error: null }
    const form = fd({ ...camposValidos, empresa_mae_id: "00000000-0000-4000-8000-000000000099" })
    await expect(createEmpresa(form)).rejects.toThrow("NEXT_REDIRECT")
    const payload = state.calls.payload as Record<string, unknown>
    expect(payload.empresa_mae_id).toBeNull()
  })

  it("validação: razão social curta retorna fieldErrors e não toca o banco", async () => {
    const result = await createEmpresa(fd({ ...camposValidos, razao_social: "AB" }))
    expect(result?.error).toBeDefined()
    expect(result?.error).toHaveProperty("razao_social")
    expect(state.calls.table).toBeNull()
  })

  it("validação: CNPJ inválido é rejeitado", async () => {
    const result = await createEmpresa(fd({ ...camposValidos, cnpj: "11222333000180" }))
    expect(result?.error).toHaveProperty("cnpj")
    expect(state.calls.op).toBeNull()
  })

  it("erro de DB: retorna { error: { _form } } sem redirecionar", async () => {
    state.result = { data: null, error: { message: "duplicate key" } }
    const result = await createEmpresa(fd(camposValidos))
    expect(result?.error).toEqual({ _form: ["duplicate key"] })
  })
})

describe("updateEmpresa", () => {
  it("caso nominal: atualiza pelo id e redireciona", async () => {
    state.result = { data: null, error: null }
    await expect(updateEmpresa("emp-7", fd(camposValidos))).rejects.toThrow("NEXT_REDIRECT:/empresas")
    expect(state.calls.op).toBe("update")
    expect(state.calls.eq).toEqual(["id", "emp-7"])
  })

  it("erro de DB no update retorna { error }", async () => {
    state.result = { data: null, error: { message: "update falhou" } }
    const result = await updateEmpresa("emp-7", fd(camposValidos))
    expect(result?.error).toEqual({ _form: ["update falhou"] })
  })
})

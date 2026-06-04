/**
 * Fake do client Supabase para testes de Server Actions.
 *
 * As actions de escrita (empresas, epis, exames, entregas) não têm lógica de
 * negócio além de: parse/validação Zod → insert/update → revalidate/redirect.
 * Este fake captura a tabela, a operação e o payload enviados, e permite forçar
 * um erro de banco (`result.error`) ou de upload (`uploadError`) — o suficiente
 * para cobrir os caminhos de decisão (nominal / validação / erro de DB).
 *
 * Uso típico (o factory do vi.mock importa este módulo dinamicamente para não
 * esbarrar no hoisting do vi.mock):
 *
 *   const state = vi.hoisted(() => ({ result: { data: null, error: null }, ... }))
 *   vi.mock("@/lib/supabase/server", () => ({
 *     createClient: async () => {
 *       const { buildFakeClient } = await import("@/test/fake-supabase")
 *       return buildFakeClient(state)
 *     },
 *   }))
 */

export type FakeResult = { data: unknown; error: { message: string } | null }

export type FakeState = {
  /** Resultado devolvido por `.single()` / `.maybeSingle()` / await direto. */
  result: FakeResult
  /** Erro forçado no `storage.upload` (null = sucesso). */
  uploadError: { message: string } | null
  /** Erro forçado no `auth.updateUser` (null = sucesso). */
  authError: { message: string } | null
  /** Captura do que a action enviou ao banco/storage/auth. */
  calls: {
    table: string | null
    op: "insert" | "update" | null
    payload: unknown
    eq: [string, unknown] | null
    uploads: string[]
    authUpdate: Record<string, unknown> | null
  }
}

export function freshState(): FakeState {
  return {
    result: { data: null, error: null },
    uploadError: null,
    authError: null,
    calls: { table: null, op: null, payload: null, eq: null, uploads: [], authUpdate: null },
  }
}

interface FakeBuilder {
  insert(payload: unknown): FakeBuilder
  update(payload: unknown): FakeBuilder
  select(cols?: string): FakeBuilder
  eq(col: string, val: unknown): FakeBuilder
  single(): Promise<FakeResult>
  maybeSingle(): Promise<FakeResult>
  /** Torna o builder "thenable": `await supabase.from(t).insert(p)` resolve o result. */
  then(
    onfulfilled: (r: FakeResult) => unknown,
    onrejected?: (e: unknown) => unknown,
  ): Promise<unknown>
}

export function buildFakeClient(state: FakeState) {
  const builder: FakeBuilder = {
    insert(payload) {
      state.calls.op = "insert"
      state.calls.payload = payload
      return builder
    },
    update(payload) {
      state.calls.op = "update"
      state.calls.payload = payload
      return builder
    },
    select() {
      return builder
    },
    eq(col, val) {
      state.calls.eq = [col, val]
      return builder
    },
    single: async () => state.result,
    maybeSingle: async () => state.result,
    then(onfulfilled, onrejected) {
      return Promise.resolve(state.result).then(onfulfilled, onrejected)
    },
  }

  return {
    from(table: string) {
      state.calls.table = table
      return builder
    },
    auth: {
      updateUser: async (payload: Record<string, unknown>) => {
        state.calls.authUpdate = payload
        return { data: { user: null }, error: state.authError }
      },
    },
    storage: {
      from() {
        return {
          upload: async (path: string) => {
            state.calls.uploads.push(path)
            return { error: state.uploadError }
          },
          getPublicUrl: (path: string) => ({
            data: { publicUrl: `https://storage.test/${path}` },
          }),
        }
      },
    },
  }
}

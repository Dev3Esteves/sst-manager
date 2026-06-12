import { describe, it, expect } from "vitest"
import { upsertColaborador } from "./sync"
import type { PeopleColaborador } from "./contrato"

/**
 * Mock mínimo do client Supabase para os encadeamentos usados em upsertColaborador:
 *  - from("empresas").select(...)                              → await (lista)
 *  - from("colaboradores").select("id").eq(col,val).maybeSingle()
 *  - from("colaboradores").update(obj).eq("id", id)            → await
 *  - from("colaboradores").insert(obj)                         → await
 */
type Row = Record<string, unknown>
function makeDb(seed: { empresas: Row[]; colaboradores: Row[] }) {
  const inserts: Row[] = []
  const updates: { id: unknown; data: Row }[] = []
  const tables: Record<string, Row[]> = {
    empresas: seed.empresas,
    colaboradores: seed.colaboradores,
    cargos: [],
    obras: [],
  }
  function from(table: string) {
    const filters: [string, unknown][] = []
    let op: "select" | "update" = "select"
    let payload: Row | null = null
    const b: Record<string, unknown> = {}
    Object.assign(b, {
      select: () => b,
      update: (data: Row) => { op = "update"; payload = data; return b },
      insert: (data: Row) => { inserts.push(data); return Promise.resolve({ error: null }) },
      eq: (col: string, val: unknown) => {
        if (op === "update" && col === "id") {
          updates.push({ id: val, data: payload as Row })
          return Promise.resolve({ error: null })
        }
        filters.push([col, val])
        return b
      },
      maybeSingle: () => {
        const match = (tables[table] ?? []).find((r) => filters.every(([c, v]) => r[c] === v)) ?? null
        return Promise.resolve({ data: match, error: null })
      },
      then: (resolve: (v: { data: Row[]; error: null }) => void) => {
        const rows = (tables[table] ?? []).filter((r) => filters.every(([c, v]) => r[c] === v))
        resolve({ data: rows, error: null })
      },
    })
    return b
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: { from } as any, inserts, updates }
}

const base: PeopleColaborador = {
  external_id: "ext-1",
  nome_completo: "Marcia Dias Sugui",
  cpf: "29565470890",
  empresa_cnpj: "49329618000199",
  tipo_vinculo: "AMBOS",
  data_admissao: "2026-05-19",
  ativo: true,
}
const EMP = [{ id: "emp-1", cnpj: "49.329.618/0001-99" }]

describe("upsertColaborador — match por chave de negócio (corrige CPF duplicado)", () => {
  it("atualiza por external_id quando já vinculado", async () => {
    const { db, inserts, updates } = makeDb({
      empresas: EMP,
      colaboradores: [{ id: "c-1", external_id: "ext-1", cpf: "29565470890" }],
    })
    await upsertColaborador(db, base)
    expect(inserts).toHaveLength(0)
    expect(updates).toHaveLength(1)
    expect(updates[0].id).toBe("c-1")
    expect(updates[0].data.tipo_vinculo).toBe("ambos") // AMBOS → ambos
  })

  it("CPF já existe sob outro external_id: ATUALIZA e adota o external_id (não viola unique)", async () => {
    const { db, inserts, updates } = makeDb({
      empresas: EMP,
      colaboradores: [{ id: "c-9", external_id: null, cpf: "29565470890" }],
    })
    await upsertColaborador(db, base)
    expect(inserts).toHaveLength(0)
    expect(updates).toHaveLength(1)
    expect(updates[0].id).toBe("c-9")
    expect(updates[0].data.external_id).toBe("ext-1") // adota o external_id do People
  })

  it("colaborador novo: insere", async () => {
    const { db, inserts, updates } = makeDb({ empresas: EMP, colaboradores: [] })
    await upsertColaborador(db, { ...base, tipo_vinculo: "CLT" })
    expect(updates).toHaveLength(0)
    expect(inserts).toHaveLength(1)
    expect(inserts[0].external_id).toBe("ext-1")
    expect(inserts[0].tipo_vinculo).toBe("clt")
  })

  it("empresa não encontrada → erro claro (vira 422 no handler)", async () => {
    const { db } = makeDb({ empresas: [], colaboradores: [] })
    await expect(upsertColaborador(db, base)).rejects.toThrow(/Empresa não encontrada/)
  })
})

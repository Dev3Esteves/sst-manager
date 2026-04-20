/**
 * Testes de integração do GET /api/search (usado pela paleta ⌘K).
 *
 * Valida: auth exigida, early return para q < 2 chars, shape do retorno,
 * agrupamento por tipo, e robustez quando uma das tabelas retorna vazio.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const authState = { authenticated: true }

const dbState: {
  colabs: Array<Record<string, unknown>>
  empresas: Array<Record<string, unknown>>
  documentos: Array<Record<string, unknown>>
  ocorrencias: Array<Record<string, unknown>>
} = { colabs: [], empresas: [], documentos: [], ocorrencias: [] }

vi.mock("@/lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/guards")>("@/lib/auth/guards")
  return {
    ...actual,
    requireAuth: async () => {
      if (!authState.authenticated) {
        throw new actual.AuthError("Não autenticado", "UNAUTHENTICATED")
      }
      const supabase = {
        from(table: string) {
          const rows =
            table === "colaboradores" ? dbState.colabs :
            table === "empresas" ? dbState.empresas :
            table === "documentos_sst" ? dbState.documentos :
            dbState.ocorrencias
          // Cadeia .select(...).or/ilike(...).limit(N) — todas retornam o mesmo conjunto
          const chainable = {
            or: () => chainable,
            ilike: () => chainable,
            limit: async () => ({ data: rows }),
          }
          return { select: () => chainable }
        },
      }
      return { supabase, user: { id: "u1" } as { id: string }, perfil: "admin" as const }
    },
  }
})

import { GET } from "./route"

beforeEach(() => {
  authState.authenticated = true
  dbState.colabs = []
  dbState.empresas = []
  dbState.documentos = []
  dbState.ocorrencias = []
})

function req(q: string) {
  return new Request(`http://test/api/search?q=${encodeURIComponent(q)}`)
}

describe("GET /api/search", () => {
  it("retorna resultados=[] para query com menos de 2 chars (sem ir no DB)", async () => {
    const res = await GET(req("a"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.resultados).toEqual([])
  })

  it("retorna resultados=[] para query vazia", async () => {
    const res = await GET(req(""))
    const json = await res.json()
    expect(json.resultados).toEqual([])
  })

  it("retorna 401 quando não autenticado (mesmo com query válida)", async () => {
    authState.authenticated = false
    const res = await GET(req("alex"))
    expect(res.status).toBe(401)
  })

  it("busca em 4 entidades e retorna array consolidado", async () => {
    dbState.colabs = [{ id: "c1", nome_completo: "Alex Silva", cpf: "1", matricula: null, status: "ativo" }]
    dbState.empresas = [{ id: "e1", razao_social: "Alex Eng", nome_fantasia: null, cnpj: "2" }]
    dbState.documentos = [{ id: "d1", tipo: "apr", titulo: "APR Alex", numero_sequencial: 1 }]
    dbState.ocorrencias = []

    const res = await GET(req("alex"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.resultados)).toBe(true)
    // Pelo menos 3 (1 colaborador + 1 empresa + 1 documento)
    expect(json.resultados.length).toBeGreaterThanOrEqual(3)
  })

  it("resultados têm shape { tipo, id, label, href } mínimo", async () => {
    dbState.colabs = [{ id: "c1", nome_completo: "Alex Silva", cpf: "111", matricula: "E1", status: "ativo" }]

    const res = await GET(req("alex"))
    const json = await res.json()
    const colab = json.resultados.find((r: { tipo: string }) => r.tipo === "colaborador")
    expect(colab).toBeDefined()
    expect(colab.id).toBe("c1")
    expect(colab.href).toContain("/colaboradores/")
    expect(colab.label).toBe("Alex Silva")
  })

  it("query com 2 chars dispara busca (limiar inclusivo)", async () => {
    dbState.empresas = [{ id: "e1", razao_social: "AB Eng", nome_fantasia: null, cnpj: "3" }]
    const res = await GET(req("ab"))
    const json = await res.json()
    expect(json.resultados.length).toBeGreaterThan(0)
  })

  it("retorna array mesmo se todas as tabelas estão vazias", async () => {
    const res = await GET(req("nada encontrado xyz"))
    const json = await res.json()
    expect(json.resultados).toEqual([])
  })
})

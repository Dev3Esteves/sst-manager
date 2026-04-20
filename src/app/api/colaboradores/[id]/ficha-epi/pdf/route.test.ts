/**
 * Teste de integração do GET /api/colaboradores/[id]/ficha-epi/pdf.
 *
 * Garante que:
 *  - Retorna 404 se colaborador não existe
 *  - Retorna 200 com Content-Type application/pdf quando tudo OK
 *  - Tolera colaborador sem entregas (PDF em branco mas válido)
 *  - Tolera cargo/obra null (PDF com fallback "—")
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const dbState: {
  colaborador: Record<string, unknown> | null
  colabError: { message: string } | null
  entregas: Array<Record<string, unknown>> | null
} = {
  colaborador: null,
  colabError: null,
  entregas: null,
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              // colaboradores
              if (table === "colaboradores") {
                return {
                  single: async () => ({
                    data: dbState.colaborador,
                    error: dbState.colabError,
                  }),
                }
              }
              // epi_entregas — usa order() depois de eq()
              return {
                order: async () => ({
                  data: dbState.entregas ?? [],
                  error: null,
                }),
              }
            },
          }
        },
      }
    },
  }),
}))

import { GET } from "./route"

beforeEach(() => {
  dbState.colaborador = null
  dbState.colabError = null
  dbState.entregas = null
})

function paramsFor(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

describe("GET /api/colaboradores/[id]/ficha-epi/pdf", () => {
  it("retorna 404 quando colaborador não existe", async () => {
    dbState.colaborador = null
    dbState.colabError = { message: "not found" }
    const res = await GET(new Request("http://test/"), paramsFor("inexistente"))
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe("Colaborador não encontrado")
  })

  it("retorna PDF válido (200 + application/pdf) com colaborador completo", async () => {
    dbState.colaborador = {
      id: "c1",
      nome_completo: "Alex Vidal Felipe",
      cpf: "11144477735",
      matricula: "EMP-001",
      data_admissao: "2022-03-15",
      empresa: { razao_social: "SISTENGE", cnpj: "00.000.000/0001-00", logo_url: null },
      cargo: { titulo: "Encarregado" },
      obra: { nome: "DANTE / RACIONAL" },
    }
    dbState.entregas = [
      {
        data_entrega: "2024-01-15",
        quantidade: 1,
        motivo: "primeiro_fornecimento",
        epi: { descricao: "Capacete", ca: "31469" },
      },
    ]

    const res = await GET(new Request("http://test/"), paramsFor("c1"))
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/pdf")
    expect(res.headers.get("Content-Disposition")).toContain("Ficha-EPI-Alex_Vidal_Felipe.pdf")

    // Buffer é um PDF válido (inicia com %PDF-)
    const buf = Buffer.from(await res.arrayBuffer())
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-")
  })

  it("funciona com colaborador sem cargo/obra (fallback —)", async () => {
    dbState.colaborador = {
      id: "c2",
      nome_completo: "Colaborador Simples",
      cpf: "22233344400",
      matricula: null,
      data_admissao: "2023-01-01",
      empresa: { razao_social: "Empresa Teste", cnpj: "11.111.111/0001-11", logo_url: null },
      cargo: null,
      obra: null,
    }
    dbState.entregas = []

    const res = await GET(new Request("http://test/"), paramsFor("c2"))
    expect(res.status).toBe(200)
    const buf = Buffer.from(await res.arrayBuffer())
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-")
  })

  it("trata entregas=null como lista vazia sem crashar", async () => {
    dbState.colaborador = {
      id: "c3",
      nome_completo: "Sem Entregas",
      cpf: "33344455511",
      matricula: null,
      data_admissao: "2024-01-01",
      empresa: { razao_social: "X", cnpj: "22.222.222/0001-22", logo_url: null },
      cargo: { titulo: "Teste" },
      obra: { nome: "Obra X" },
    }
    dbState.entregas = null

    const res = await GET(new Request("http://test/"), paramsFor("c3"))
    expect(res.status).toBe(200)
  })

  it("resolve relação array (Supabase às vezes retorna array de 1)", async () => {
    dbState.colaborador = {
      id: "c4",
      nome_completo: "Via Array",
      cpf: "44455566622",
      matricula: "X",
      data_admissao: "2020-01-01",
      empresa: [{ razao_social: "Emp Array", cnpj: "33.333.333/0001-33", logo_url: null }],
      cargo: [{ titulo: "Array Cargo" }],
      obra: [{ nome: "Array Obra" }],
    }
    dbState.entregas = []

    const res = await GET(new Request("http://test/"), paramsFor("c4"))
    expect(res.status).toBe(200)
  })
})

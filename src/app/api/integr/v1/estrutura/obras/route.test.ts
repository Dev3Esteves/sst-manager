import { describe, it, expect, beforeEach, vi } from "vitest"

/**
 * Teste do endpoint de leitura de obras consumido pelo Sistenge People.
 * Cobre: auth por API key (401), envelope { obras: [...] }, mapeamento dos
 * campos (local composto, ativo), filtro por empresa_cnpj e envelope vazio
 * quando o CNPJ não casa nenhuma empresa.
 */

const API_KEY = "key-de-teste"

// Fake do client admin controlável por teste (empresas + obras).
let currentAdmin: ReturnType<typeof makeAdmin>
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => currentAdmin.client,
}))

import { GET } from "./route"

type Row = Record<string, unknown>
function makeAdmin(seed: { empresas: Row[]; obras: Row[] }) {
  // Captura o filtro empresa_id IN aplicado às obras, p/ asserção.
  let obrasInIds: string[] | null = null
  function from(table: string) {
    if (table === "empresas") {
      return { select: () => Promise.resolve({ data: seed.empresas, error: null }) }
    }
    // obras: select(...).order(...) [.in("empresa_id", ids)] → await
    const builder: Record<string, unknown> = {
      select: () => builder,
      order: () => builder,
      in: (_col: string, ids: string[]) => {
        obrasInIds = ids
        return builder
      },
      then: (resolve: (v: { data: Row[]; error: null }) => void) => {
        const rows = obrasInIds
          ? seed.obras.filter((o) => obrasInIds!.includes(o.empresa_id as string))
          : seed.obras
        resolve({ data: rows, error: null })
      },
    }
    return builder
  }
  return { client: { from }, get obrasInIds() { return obrasInIds } }
}

function req(url = "http://localhost/api/integr/v1/estrutura/obras", comKey = true): Request {
  const headers: Record<string, string> = {}
  if (comKey) headers["authorization"] = `Bearer ${API_KEY}`
  return new Request(url, { method: "GET", headers })
}

const EMPRESAS = [
  { id: "emp-1", cnpj: "49.329.618/0001-99" },
  { id: "emp-2", cnpj: "11222333000181" },
]
const OBRAS = [
  { id: "obr-uuid-1", codigo: "OBR-001", nome: "Unimed Sede", cidade: "Belo Horizonte", uf: "MG", ativa: true, empresa_id: "emp-1" },
  { id: "obr-uuid-2", codigo: "OBR-002", nome: "Galpão Norte", cidade: "Contagem", uf: null, ativa: false, empresa_id: "emp-1" },
  { id: "obr-uuid-3", codigo: "OBR-003", nome: "Filial SP", cidade: null, uf: null, ativa: true, empresa_id: "emp-2" },
]

beforeEach(() => {
  process.env.PEOPLE_API_KEY = API_KEY
  currentAdmin = makeAdmin({ empresas: EMPRESAS, obras: OBRAS })
})

describe("GET /api/integr/v1/estrutura/obras", () => {
  it("401 sem API key", async () => {
    const res = await GET(req(undefined, false))
    expect(res.status).toBe(401)
  })

  it("200 com envelope { obras } e mapeamento dos campos", async () => {
    const res = await GET(req())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.obras)).toBe(true)
    expect(body.obras).toHaveLength(3)
    expect(body.obras[0]).toEqual({
      id: "obr-uuid-1",
      codigo: "OBR-001",
      nome: "Unimed Sede",
      local: "Belo Horizonte/MG",
      ativo: true,
    })
  })

  it("compõe local com fallback (só cidade, ou null) e expõe ativo=false", async () => {
    const body = await (await GET(req())).json()
    const norte = body.obras.find((o: { id: string }) => o.id === "obr-uuid-2")
    expect(norte.local).toBe("Contagem") // sem UF
    expect(norte.ativo).toBe(false)
    const sp = body.obras.find((o: { id: string }) => o.id === "obr-uuid-3")
    expect(sp.local).toBeNull() // sem cidade nem UF
  })

  it("filtra por empresa_cnpj (compara só dígitos, ignora máscara)", async () => {
    const res = await GET(req("http://localhost/api/integr/v1/estrutura/obras?empresa_cnpj=49329618000199"))
    const body = await res.json()
    expect(currentAdmin.obrasInIds).toEqual(["emp-1"])
    expect(body.obras.map((o: { id: string }) => o.id)).toEqual(["obr-uuid-1", "obr-uuid-2"])
  })

  it("envelope vazio quando o CNPJ não casa nenhuma empresa (nunca 404)", async () => {
    const res = await GET(req("http://localhost/api/integr/v1/estrutura/obras?empresa_cnpj=00000000000000"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ obras: [] })
  })
})

import { describe, it, expect, beforeEach, vi } from "vitest"
import { assinarPayload } from "@/lib/integracao/people/assinatura"

/**
 * Teste de handler do webhook People (boundary HTTP).
 *
 * Cobre o que o teste do sync não vê: autenticação por assinatura, parsing,
 * validação do envelope, idempotência, roteamento por event_type e os códigos
 * de resposta (401/400/422/200) + a gravação em integr_evento. A lógica de
 * aplicação (sync) é mockada — já tem cobertura própria em sync.test.ts.
 */

const SECRET = "segredo-de-teste"

// --- mocks ----------------------------------------------------------------
// O client admin é trocado por um fake controlável por teste (idempotência +
// captura dos upserts em integr_evento).
let currentAdmin: ReturnType<typeof makeAdmin>
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => currentAdmin.client,
}))

// O sync é mockado — queremos testar o roteamento, não a aplicação.
vi.mock("@/lib/integracao/people/sync", () => ({
  upsertCargo: vi.fn(),
  upsertColaborador: vi.fn(),
  desativarPorExternalId: vi.fn(),
}))

import { POST } from "./route"
import { upsertCargo, upsertColaborador, desativarPorExternalId } from "@/lib/integracao/people/sync"

type EventoRow = Record<string, unknown>
function makeAdmin(existente: { event_id: string; status: string } | null) {
  const upserts: EventoRow[] = []
  const client = {
    from(table: string) {
      if (table !== "integr_evento") {
        throw new Error(`tabela inesperada no handler: ${table}`)
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: existente, error: null }) }),
        }),
        upsert: (row: EventoRow) => {
          upserts.push(row)
          return Promise.resolve({ error: null })
        },
      }
    },
  }
  return { client, upserts }
}

function reqAssinado(body: string, sig = assinarPayload(body, SECRET)): Request {
  return new Request("http://localhost/api/integr/people/webhook", {
    method: "POST",
    body,
    headers: { "x-people-signature": sig, "content-type": "application/json" },
  })
}

function evento(tipo: string, data: Record<string, unknown>, event_id = "evt-1") {
  return JSON.stringify({ event_id, event_type: tipo, data })
}

const COLAB = {
  external_id: "ext-1",
  nome_completo: "Marcia Dias Sugui",
  cpf: "29565470890",
  empresa_cnpj: "49329618000199",
  tipo_vinculo: "AMBOS",
  data_admissao: "2026-05-19",
  ativo: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.PEOPLE_WEBHOOK_SECRET = SECRET
  currentAdmin = makeAdmin(null)
})

describe("POST /api/integr/people/webhook", () => {
  it("401 quando a assinatura é inválida — não grava evento", async () => {
    const body = evento("colaborador.upserted", COLAB)
    const res = await POST(reqAssinado(body, "sha256=deadbeef"))
    expect(res.status).toBe(401)
    expect(currentAdmin.upserts).toHaveLength(0)
    expect(upsertColaborador).not.toHaveBeenCalled()
  })

  it("400 quando o corpo (assinado) não é JSON — não grava evento", async () => {
    const res = await POST(reqAssinado("isto não é json"))
    expect(res.status).toBe(400)
    expect(currentAdmin.upserts).toHaveLength(0)
  })

  it("422 quando o envelope é inválido (ex.: event_type desconhecido / lote) — não grava evento", async () => {
    // Um array (envio em lote) não casa com o envelope de 1 evento → 422.
    const res = await POST(reqAssinado(JSON.stringify([{ event_id: "a" }, { event_id: "b" }])))
    expect(res.status).toBe(422)
    expect(currentAdmin.upserts).toHaveLength(0)
  })

  it("200 idempotente quando o evento já foi processado — não reaplica", async () => {
    currentAdmin = makeAdmin({ event_id: "evt-1", status: "processado" })
    const res = await POST(reqAssinado(evento("colaborador.upserted", COLAB)))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ idempotente: true })
    expect(upsertColaborador).not.toHaveBeenCalled()
    expect(currentAdmin.upserts).toHaveLength(0)
  })

  it("colaborador.upserted: aplica e grava 'processado' com payload", async () => {
    const res = await POST(reqAssinado(evento("colaborador.upserted", COLAB)))
    expect(res.status).toBe(200)
    expect(upsertColaborador).toHaveBeenCalledTimes(1)
    expect(currentAdmin.upserts).toHaveLength(1)
    expect(currentAdmin.upserts[0]).toMatchObject({
      event_id: "evt-1",
      tipo: "colaborador.upserted",
      status: "processado",
      detalhe: null,
    })
    expect(currentAdmin.upserts[0].payload).toMatchObject({ cpf: COLAB.cpf })
  })

  it("cargo.upserted: roteia para upsertCargo", async () => {
    const data = { external_id: "c-1", nome: "Pedreiro", empresa_cnpj: "49329618000199" }
    const res = await POST(reqAssinado(evento("cargo.upserted", data)))
    expect(res.status).toBe(200)
    expect(upsertCargo).toHaveBeenCalledTimes(1)
  })

  it("colaborador.deleted: soft-delete por external_id", async () => {
    const res = await POST(reqAssinado(evento("colaborador.deleted", { external_id: "ext-1" })))
    expect(res.status).toBe(200)
    expect(desativarPorExternalId).toHaveBeenCalledWith(expect.anything(), "colaboradores", "ext-1")
  })

  it("422 + grava 'erro' com detalhe e payload quando a aplicação lança", async () => {
    vi.mocked(upsertColaborador).mockRejectedValueOnce(
      new Error("Empresa não encontrada para CNPJ 49329618000199"),
    )
    const res = await POST(reqAssinado(evento("colaborador.upserted", COLAB)))
    expect(res.status).toBe(422)
    expect(currentAdmin.upserts).toHaveLength(1)
    expect(currentAdmin.upserts[0]).toMatchObject({ status: "erro", tipo: "colaborador.upserted" })
    expect(String(currentAdmin.upserts[0].detalhe)).toMatch(/Empresa não encontrada/)
    expect(currentAdmin.upserts[0].payload).toMatchObject({ cpf: COLAB.cpf })
  })

  it("aso.agendamento_solicitado: valida e 'estaciona' (sem chamar sync)", async () => {
    const data = {
      candidatura_external_id: "cand-1",
      candidato: { nome_completo: "Fulano de Tal" },
      empresa_cnpj: "49329618000199",
    }
    const res = await POST(reqAssinado(evento("aso.agendamento_solicitado", data)))
    expect(res.status).toBe(200)
    expect(upsertCargo).not.toHaveBeenCalled()
    expect(upsertColaborador).not.toHaveBeenCalled()
    expect(currentAdmin.upserts[0]).toMatchObject({
      tipo: "aso.agendamento_solicitado",
      status: "processado",
    })
  })

  it("422 quando aso.agendamento_solicitado tem data inválida — grava 'erro'", async () => {
    const res = await POST(reqAssinado(evento("aso.agendamento_solicitado", { foo: "bar" })))
    expect(res.status).toBe(422)
    expect(currentAdmin.upserts[0]).toMatchObject({ status: "erro" })
  })
})

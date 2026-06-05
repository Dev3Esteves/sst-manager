import { describe, it, expect } from "vitest"
import { assinarPayload, verificarAssinatura } from "./assinatura"
import { peopleEventoSchema, peopleColaboradorSchema } from "./contrato"

const SEGREDO = "segredo-de-teste-123"

describe("assinatura HMAC", () => {
  it("aceita assinatura válida (hex puro)", () => {
    const payload = '{"event_id":"1"}'
    const sig = assinarPayload(payload, SEGREDO)
    expect(verificarAssinatura(payload, sig, SEGREDO)).toBe(true)
  })

  it("aceita o prefixo sha256=", () => {
    const payload = '{"a":1}'
    const sig = assinarPayload(payload, SEGREDO)
    expect(verificarAssinatura(payload, `sha256=${sig}`, SEGREDO)).toBe(true)
  })

  it("rejeita payload adulterado", () => {
    const sig = assinarPayload('{"valor":100}', SEGREDO)
    expect(verificarAssinatura('{"valor":999}', sig, SEGREDO)).toBe(false)
  })

  it("rejeita segredo errado", () => {
    const sig = assinarPayload("x", SEGREDO)
    expect(verificarAssinatura("x", sig, "outro-segredo")).toBe(false)
  })

  it("rejeita assinatura/segredo ausentes", () => {
    expect(verificarAssinatura("x", null, SEGREDO)).toBe(false)
    expect(verificarAssinatura("x", "abc", undefined)).toBe(false)
  })
})

describe("contrato People", () => {
  it("valida um evento bem formado", () => {
    const r = peopleEventoSchema.safeParse({
      event_id: "evt_1", event_type: "colaborador.upserted", data: {},
    })
    expect(r.success).toBe(true)
  })

  it("rejeita event_type desconhecido", () => {
    const r = peopleEventoSchema.safeParse({ event_id: "1", event_type: "foo.bar", data: {} })
    expect(r.success).toBe(false)
  })

  it("colaborador exige cpf, nome e data_admissao", () => {
    const ok = peopleColaboradorSchema.safeParse({
      external_id: "c1", nome_completo: "João", cpf: "11144477735",
      empresa_cnpj: "11222333000181", data_admissao: "2026-01-10",
    })
    expect(ok.success).toBe(true)
    const falta = peopleColaboradorSchema.safeParse({ external_id: "c1", nome_completo: "João" })
    expect(falta.success).toBe(false)
  })
})

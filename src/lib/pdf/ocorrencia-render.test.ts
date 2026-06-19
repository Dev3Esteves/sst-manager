import { describe, it, expect } from "vitest"
import { renderToBuffer } from "@react-pdf/renderer"
import { renderOcorrenciaPdf } from "./ocorrencia"
import type { OcorrenciaPdfData } from "./ocorrencia-builder"

const base: OcorrenciaPdfData = {
  numero_sequencial: 30,
  tipo: "acidente_tipico",
  tipo_label: "Acidente típico",
  data_ocorrencia: "2026-06-08",
  local: "Equinix SP4 — Área Externa",
  descricao: "Perfuração no pé direito ao pisar em prego exposto.",
  gravidade: "leve",
  gravidade_label: "Leve",
  parte_corpo_atingida: "Pé direito",
  regioes_corpo: ["pe_dir", "torax", "costas_inferior"],
  natureza_lesao: "Perfuração",
  agente_causador: "Prego exposto",
  dias_afastamento: 0,
  status: "investigando",
  empresa_razao_social: "Construtora Exemplo Ltda",
  empresa_cnpj: "49329618000199",
  colaborador_nome: "Pedro Lucas Nascimento Castro",
  investigacao: null,
  acoes_corretivas: [],
}

describe("renderOcorrenciaPdf — mapa do corpo", () => {
  it("renderiza o PDF com o mapa do corpo (SVG) sem quebrar", async () => {
    const el = await renderOcorrenciaPdf(base, "https://app.test", "abc-123")
    const buf = await renderToBuffer(el)
    expect(buf.length).toBeGreaterThan(2000)
  })

  it("renderiza sem regiões (sem o mapa) normalmente", async () => {
    const el = await renderOcorrenciaPdf({ ...base, regioes_corpo: null }, "https://app.test", "abc-123")
    const buf = await renderToBuffer(el)
    expect(buf.length).toBeGreaterThan(1000)
  })
})

import { describe, it, expect } from "vitest"
import { renderToBuffer } from "@react-pdf/renderer"
import { renderPsicossocialRelatorioPdf, type RelatorioPsiData } from "./psicossocial-relatorio"

const base: RelatorioPsiData = {
  empresaRazaoSocial: "Empresa Exemplo Engenharia",
  empresaCnpj: "00.000.000/0001-00",
  obraNome: "Obra Teste",
  pgrRevisao: 0,
  campanhaTitulo: "Avaliação Psicossocial 2026",
  instrumentoNome: "COPSOQ II-Br (curta)",
  versao: "curto",
  dataInicio: "2026-06-01",
  dataFim: "2026-06-15",
  status: "analisada",
  minRespondentes: 5,
  ghes: [
    { codigo: "GHE 01", descricao: "ADMINISTRAÇÃO", numExpostos: 10, respondentes: 6 },
    { codigo: "GHE 02", descricao: "OPERACIONAL", numExpostos: 20, respondentes: 3 },
  ],
  resultados: [
    { gheCodigo: "GHE 01", dominio: "Exigências", dimensao: "Demandas no trabalho", score: 80, classificacao: "vermelho", n: 6, suprimido: false },
    { gheCodigo: "GHE 01", dominio: "Organização", dimensao: "Influência e desenvolvimento", score: 20, classificacao: "verde", n: 6, suprimido: false },
    { gheCodigo: "GHE 02", dominio: "Exigências", dimensao: "Demandas no trabalho", score: null, classificacao: null, n: 3, suprimido: true },
  ],
}

describe("renderPsicossocialRelatorioPdf", () => {
  it("gera um PDF válido com resultados e QR", async () => {
    const el = await renderPsicossocialRelatorioPdf(base, "https://app.test", "abcd1234-ef56-7890-abcd-ef1234567890")
    const buf = await renderToBuffer(el)
    expect(buf.length).toBeGreaterThan(1000)
  })

  it("gera PDF sem appUrl (sem QR) e sem dados", async () => {
    const el = await renderPsicossocialRelatorioPdf({ ...base, ghes: [], resultados: [] }, "", "id-curto")
    const buf = await renderToBuffer(el)
    expect(buf.length).toBeGreaterThan(500)
  })

  it("renderiza a seção qualitativa (temas + verbatim aprovado) sem quebrar", async () => {
    const el = await renderPsicossocialRelatorioPdf(
      {
        ...base,
        recusas: 2,
        qualitativo: [
          {
            gheCodigo: "GHE 01",
            temas: [{ titulo: "Carga de trabalho", frequencia: 4, resumo: "Relatos de excesso de demandas." }],
            sugestoes: ["Revisar dimensionamento da equipe."],
            verbatim: ["O ritmo é muito puxado no fim do mês."],
          },
        ],
      },
      "https://app.test",
      "abcd1234-ef56-7890-abcd-ef1234567890",
    )
    const buf = await renderToBuffer(el)
    expect(buf.length).toBeGreaterThan(1000)
  })
})

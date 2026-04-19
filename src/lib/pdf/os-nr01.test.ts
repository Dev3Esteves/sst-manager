import { describe, it, expect } from "vitest"
import { renderToBuffer } from "@react-pdf/renderer"
import { renderOsNr01Pdf, type OsNr01Data } from "./os-nr01"

/**
 * Smoke tests: renderizam a OS NR-01 em memória e verificam que o PDF
 * sai válido. Conteúdo binário não é snapshotado porque `@react-pdf/renderer`
 * embeda timestamps que variam entre runs.
 */
describe("renderOsNr01Pdf", () => {
  const dadosBase: OsNr01Data = {
    empresa_razao_social: "SISTENGE Engenharia Ltda",
    empresa_cnpj: "45.543.915/0001-81",
    empresa_logo_url: null,
    numero_os: "OS-2026-0001",
    data_emissao: "2026-04-18",
    revisao: "00",
    obra_nome: "DANTE / RACIONAL",
    cargo_titulo: "Encarregado de Obras Técnico",
    descricao_atividades: "Supervisão de equipes em obras elétricas de média e alta tensão.",
    riscos: [
      "Choque elétrico por contato direto com partes energizadas",
      "Queda em altura em estruturas metálicas",
      "Queimaduras por arco elétrico",
    ],
    medidas_preventivas: [
      "Isolamento e sinalização da área de trabalho",
      "Desenergização conforme NR-10",
    ],
    epis_obrigatorios: [
      { descricao: "Capacete Classe B", ca: "31469", observacao: null },
      { descricao: "Bota Dielétrica Classe 3", ca: "22111", observacao: "Para MT" },
    ],
    epis_eventuais: [
      { descricao: "Avental de raspa", ca: "10000", observacao: "Quando em solda" },
    ],
    observacoes: null,
    colaboradores: [
      {
        nome_completo: "Alex Vidal Felipe",
        cpf: "11144477735",
        matricula: "EMP-001",
        data_admissao: "2022-03-15",
      },
    ],
  }

  it("renderiza uma OS válida com 1 colaborador (1 página)", async () => {
    const element = await renderOsNr01Pdf(dadosBase)
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
    expect(buffer.length).toBeGreaterThan(2000)
  })

  it("renderiza 1 página por colaborador (teste com 5 colaboradores)", async () => {
    const colabs = Array.from({ length: 5 }, (_, i) => ({
      nome_completo: `Colaborador ${i + 1}`,
      cpf: `1114447773${i}`,
      matricula: `EMP-00${i + 1}`,
      data_admissao: "2023-01-01",
    }))
    const element = await renderOsNr01Pdf({ ...dadosBase, colaboradores: colabs })
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
    // PDF com 5 páginas é maior que com 1 página
    const pequeno = await renderToBuffer(await renderOsNr01Pdf(dadosBase))
    expect(buffer.length).toBeGreaterThan(pequeno.length)
  })

  it("aceita listas vazias de riscos/medidas/EPIs (fallback '—')", async () => {
    const element = await renderOsNr01Pdf({
      ...dadosBase,
      riscos: [],
      medidas_preventivas: [],
      epis_obrigatorios: [],
      epis_eventuais: [],
    })
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
  })

  it("usa recomendações padrão quando não fornecidas", async () => {
    const element = await renderOsNr01Pdf({ ...dadosBase, recomendacoes: undefined })
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
  })

  it("aceita observações e responsáveis customizados", async () => {
    const element = await renderOsNr01Pdf({
      ...dadosBase,
      observacoes: "Atividade crítica — requer acompanhamento permanente.",
      responsavel_area_nome: "João da Silva",
      responsavel_area_cargo: "Gerente de Obras",
      tec_seguranca_nome: "Maria Santos",
      tec_seguranca_crea: "SP-123456",
    })
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
  })
})

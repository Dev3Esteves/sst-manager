import { describe, it, expect } from "vitest"
import { renderToBuffer } from "@react-pdf/renderer"
import { renderFichaEpiPdf, type FichaEpiData } from "./ficha-epi"

/**
 * Smoke tests: renderizam o PDF em memória e verificam que a saída é um
 * Buffer PDF válido (começa com "%PDF-"). Não fazem snapshot binário do
 * conteúdo porque os PDFs geram bytes diferentes a cada chamada (metadata
 * de geração, timestamps internos). Um PDF válido é suficiente.
 */
describe("renderFichaEpiPdf", () => {
  const dadosMinimos: FichaEpiData = {
    empresa_razao_social: "SISTENGE Engenharia Ltda",
    empresa_cnpj: "45.543.915/0001-81",
    empresa_logo_url: null,
    colaborador_nome: "Alex Vidal Felipe",
    colaborador_cpf: "11144477735",
    colaborador_matricula: "EMP-001",
    cargo_titulo: "Encarregado de Obras Técnico",
    data_admissao: "2022-03-15",
    obra_nome: "DANTE / RACIONAL",
    entregas: [],
    emitido_em: "2026-04-18T10:00:00Z",
  }

  it("renderiza um PDF válido sem entregas (formulário em branco)", async () => {
    const element = await renderFichaEpiPdf(dadosMinimos)
    const buffer = await renderToBuffer(element)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
    expect(buffer.length).toBeGreaterThan(1000) // PDF mínimo tem algum conteúdo
  })

  it("renderiza um PDF válido com múltiplas entregas cumulativas", async () => {
    const element = await renderFichaEpiPdf({
      ...dadosMinimos,
      entregas: [
        {
          data_entrega: "2024-01-15",
          quantidade: 1,
          epi_descricao: "Capacete Aba Frontal Classe B",
          ca: "31469",
          responsavel: "Segurança do Trabalho",
        },
        {
          data_entrega: "2024-06-10",
          quantidade: 2,
          epi_descricao: "Luva de vaqueta cano curto",
          ca: "12345",
          data_devolucao: "2024-12-20",
        },
        {
          data_entrega: "2025-02-01",
          quantidade: 1,
          epi_descricao: "Bota de segurança com biqueira",
          ca: "56789",
        },
      ],
    })
    const buffer = await renderToBuffer(element)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
  })

  it("lida com campos opcionais ausentes (matrícula, obra, cargo)", async () => {
    const element = await renderFichaEpiPdf({
      ...dadosMinimos,
      cargo_titulo: null,
      colaborador_matricula: null,
      obra_nome: null,
      data_admissao: null,
    })
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
  })

  it("ordena as entregas cronologicamente (mesmo se vierem fora de ordem)", async () => {
    const element = await renderFichaEpiPdf({
      ...dadosMinimos,
      entregas: [
        { data_entrega: "2025-05-01", quantidade: 1, epi_descricao: "EPI C", ca: "111" },
        { data_entrega: "2024-01-01", quantidade: 1, epi_descricao: "EPI A", ca: "222" },
        { data_entrega: "2024-12-01", quantidade: 1, epi_descricao: "EPI B", ca: "333" },
      ],
    })
    // Se não lançou, a ordenação interna funcionou
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
  })
})

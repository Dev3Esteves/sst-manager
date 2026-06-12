import { describe, it, expect } from "vitest"
import { renderToBuffer } from "@react-pdf/renderer"
import { renderCertificadoPdf, limparItemConteudo, type CertificadoData } from "./certificado"

// Conteúdo "sujo" como vem do Word (checkmark Wingdings "ü" + TAB)
const conteudoSujo = [
  "ü\tIntrodução;",
  "ü\tO que é Equipamento de Proteção Individual;",
  "ü\tResponsabilidade do Empregador;",
  "ü\tResponsabilidade do Empregado;",
  "ü\tResponsabilidades dos Fabricantes e Importadores;",
  "ü\tDa Competências do Ministério do Trabalho e Emprego - MTE;",
  "ü\tRisco pelo Não uso do EPI;",
  "ü\tEPI para Proteção Membros Inferiores;",
  "ü\tEPI para Proteção Membros Superiores;",
  "ü\tEPI contra Queda de diferença de nível;",
  "ü\tEPI para a Proteção dos Pés;",
  "ü\tEPI para a Proteção do Corpo Inteiro;",
  "ü\tHigienização, Conservação e Guarda de EPI'S;",
  "ü\tFicha de EPI.",
]

const data: CertificadoData = {
  numero: "CERT-2026-3BF1FB4E",
  aluno_nome: "Marcia Dias Sugui",
  aluno_cpf: "295.654.708-90",
  curso_titulo: "Treinamento EPI's e EPC's",
  nr_referencia: "NR 06",
  carga_horaria: 2,
  conteudo_programatico: conteudoSujo,
  data_realizacao: "2026-05-19",
  data_vencimento: "2027-05-19",
  cidade: "São Paulo",
  instrutor_nome: "Fernanda Emiliano Cavalcante",
  instrutor_cargo: "Instrutor responsável",
  empresa_razao_social: "Sistenge Construções e Comércio Ltda",
  empresa_cnpj: "49.329.618/0001-99",
  validacao_url: "https://sst-manager-mu.vercel.app/treinamentos/realizacoes/abc",
}

function contarPaginas(buf: Buffer): number {
  const txt = buf.toString("latin1")
  const matches = txt.match(/\/Type\s*\/Page(?![s])/g)
  return matches ? matches.length : 0
}

describe("certificado — sanitização e contagem de páginas", () => {
  it("limparItemConteudo remove ü/TAB e bullets à esquerda", () => {
    expect(limparItemConteudo("ü\tIntrodução;")).toBe("Introdução;")
    expect(limparItemConteudo("• EPI para os Pés")).toBe("EPI para os Pés")
    expect(limparItemConteudo("   ✓  Ficha de EPI.")).toBe("Ficha de EPI.")
  })

  it("gera exatamente 2 páginas (sem 3ª em branco) mesmo com lista longa", async () => {
    const el = await renderCertificadoPdf(data)
    const buf = await renderToBuffer(el)
    expect(contarPaginas(buf)).toBe(2)
  })

  it("orientação retrato gera 1 única página", async () => {
    const el = await renderCertificadoPdf(data, "retrato")
    const buf = await renderToBuffer(el)
    expect(contarPaginas(buf)).toBe(1)
  })
})

import { describe, it, expect } from "vitest"
import { sanitizeFilename, buildDocFilename } from "./batch-utils"

describe("sanitizeFilename", () => {
  it("remove acentos do português", () => {
    expect(sanitizeFilename("João da Silva")).toBe("JOAO_DA_SILVA")
    expect(sanitizeFilename("Ação Preventiva")).toBe("ACAO_PREVENTIVA")
    expect(sanitizeFilename("Maria José")).toBe("MARIA_JOSE")
    expect(sanitizeFilename("César Ribeiro")).toBe("CESAR_RIBEIRO")
  })

  it("remove pontuação", () => {
    expect(sanitizeFilename("Maria José #42!")).toBe("MARIA_JOSE_42")
    expect(sanitizeFilename("João, D'Arc")).toBe("JOAO_DARC")
    expect(sanitizeFilename("Carlos@email.com")).toBe("CARLOSEMAILCOM")
  })

  it("converte hífens e espaços em underscores", () => {
    expect(sanitizeFilename("Ana - Eletricista")).toBe("ANA_ELETRICISTA")
    expect(sanitizeFilename("Jean-Pierre")).toBe("JEAN_PIERRE")
  })

  it("colapsa múltiplos espaços/underscores", () => {
    expect(sanitizeFilename("João   da   Silva")).toBe("JOAO_DA_SILVA")
    expect(sanitizeFilename("A  ---  B")).toBe("A_B")
  })

  it("remove underscores de borda", () => {
    expect(sanitizeFilename(" João ")).toBe("JOAO")
    expect(sanitizeFilename("-Ana-")).toBe("ANA")
  })

  it("mantém maiúsculas", () => {
    expect(sanitizeFilename("joão silva")).toBe("JOAO_SILVA")
    expect(sanitizeFilename("JOÃO SILVA")).toBe("JOAO_SILVA")
  })

  it("preserva números", () => {
    expect(sanitizeFilename("Bloco 3A")).toBe("BLOCO_3A")
    expect(sanitizeFilename("Colaborador 2026")).toBe("COLABORADOR_2026")
  })
})

describe("buildDocFilename", () => {
  it("monta filename com convenção PREFIX_NOME.pdf", () => {
    expect(buildDocFilename("NR-10", "João da Silva")).toBe("NR-10_JOAO_DA_SILVA.pdf")
    expect(buildDocFilename("NR-35", "Maria Santos")).toBe("NR-35_MARIA_SANTOS.pdf")
    expect(buildDocFilename("NR-33", "Pedro Oliveira")).toBe("NR-33_PEDRO_OLIVEIRA.pdf")
  })

  it("preserva hífens do prefixo (NR-10, NR-35)", () => {
    expect(buildDocFilename("NR-10", "Ana")).toBe("NR-10_ANA.pdf")
    expect(buildDocFilename("CERT_NR-10", "Ana")).toBe("CERT_NR-10_ANA.pdf")
  })

  it("sanitiza o nome mas não o prefixo", () => {
    expect(buildDocFilename("CERT_TREINAMENTO", "José da Silva"))
      .toBe("CERT_TREINAMENTO_JOSE_DA_SILVA.pdf")
  })

  it("gera filenames únicos para nomes similares", () => {
    const a = buildDocFilename("NR-10", "Ana Costa")
    const b = buildDocFilename("NR-10", "Ana Costas")
    expect(a).not.toBe(b)
    expect(a).toBe("NR-10_ANA_COSTA.pdf")
    expect(b).toBe("NR-10_ANA_COSTAS.pdf")
  })
})

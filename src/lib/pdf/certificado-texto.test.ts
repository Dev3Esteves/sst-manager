import { describe, it, expect } from "vitest"
import {
  interpolarTextoCertificado,
  TEXTO_CERTIFICADO_PADRAO,
  VARIAVEIS_DISPONIVEIS,
  type CertificadoVars,
} from "./certificado-texto"

const varsExemplo: CertificadoVars = {
  aluno_nome: "JOÃO DA SILVA",
  aluno_cpf: "123.456.789-00",
  curso_titulo: "NR-10 Básico",
  nr_referencia: "NR-10",
  carga_horaria: 40,
  data_realizacao: "2026-04-15",
  data_vencimento: "2028-04-15",
  cidade: "São Paulo",
  entidade: "Centro ABC",
  instrutor: "Maria",
  empresa: "Empresa Demo",
}

describe("interpolarTextoCertificado", () => {
  it("substitui variáveis simples", () => {
    const template = "Aluno: {{aluno_nome}}, curso: {{curso_titulo}}"
    const resultado = interpolarTextoCertificado(template, varsExemplo)
    expect(resultado).toBe("Aluno: JOÃO DA SILVA, curso: NR-10 Básico")
  })

  it("formata datas para pt-BR", () => {
    const template = "Realizado em {{data_realizacao}}"
    expect(interpolarTextoCertificado(template, varsExemplo)).toBe("Realizado em 15/04/2026")
  })

  it("formata carga horária como string", () => {
    const template = "Carga: {{carga_horaria}}h"
    expect(interpolarTextoCertificado(template, varsExemplo)).toBe("Carga: 40h")
  })

  it("respeita nr_referencia_parenteses quando há NR", () => {
    const template = "{{curso_titulo}}{{nr_referencia_parenteses}}"
    expect(interpolarTextoCertificado(template, varsExemplo)).toBe("NR-10 Básico (NR-10)")
  })

  it("deixa nr_referencia_parenteses vazio quando não há NR", () => {
    const template = "{{curso_titulo}}{{nr_referencia_parenteses}}"
    const semNr = { ...varsExemplo, nr_referencia: null }
    expect(interpolarTextoCertificado(template, semNr)).toBe("NR-10 Básico")
  })

  it("entidade_trecho é texto condicional", () => {
    const template = "Curso{{entidade_trecho}}."
    expect(interpolarTextoCertificado(template, varsExemplo))
      .toBe("Curso, ministrado por Centro ABC.")

    const semEntidade = { ...varsExemplo, entidade: null }
    expect(interpolarTextoCertificado(template, semEntidade)).toBe("Curso.")
  })

  it("validade_trecho só aparece com vencimento", () => {
    const template = "Certificado.{{validade_trecho}}"
    expect(interpolarTextoCertificado(template, varsExemplo))
      .toBe("Certificado. O certificado é válido até 15/04/2028.")

    const semVencimento = { ...varsExemplo, data_vencimento: null }
    expect(interpolarTextoCertificado(template, semVencimento)).toBe("Certificado.")
  })

  it("mantém tags desconhecidas como estão (não quebra silenciosamente)", () => {
    const template = "Com {{variavel_inexistente}} teste"
    expect(interpolarTextoCertificado(template, varsExemplo))
      .toBe("Com {{variavel_inexistente}} teste")
  })

  it("processa múltiplas ocorrências da mesma variável", () => {
    const template = "{{aluno_nome}} — {{aluno_nome}}"
    expect(interpolarTextoCertificado(template, varsExemplo))
      .toBe("JOÃO DA SILVA — JOÃO DA SILVA")
  })

  it("template padrão substitui todas as variáveis sem deixar placeholders", () => {
    const resultado = interpolarTextoCertificado(TEXTO_CERTIFICADO_PADRAO, varsExemplo)
    expect(resultado).not.toContain("{{")
    expect(resultado).not.toContain("}}")
    expect(resultado).toContain("JOÃO DA SILVA")
    expect(resultado).toContain("123.456.789-00")
    expect(resultado).toContain("NR-10")
    expect(resultado).toContain("40 horas")
    expect(resultado).toContain("15/04/2026")
  })
})

describe("VARIAVEIS_DISPONIVEIS", () => {
  it("lista não está vazia", () => {
    expect(VARIAVEIS_DISPONIVEIS.length).toBeGreaterThan(0)
  })

  it("todas as entries têm tag no formato {{xxx}} e descrição", () => {
    for (const v of VARIAVEIS_DISPONIVEIS) {
      expect(v.tag).toMatch(/^\{\{\w+\}\}$/)
      expect(v.descricao.length).toBeGreaterThan(0)
    }
  })

  it("todas as variáveis listadas são resolvidas pelo interpolador (sem ficar como placeholder)", () => {
    for (const v of VARIAVEIS_DISPONIVEIS) {
      const resultado = interpolarTextoCertificado(v.tag, varsExemplo)
      expect(resultado, `Variável ${v.tag} deveria ser substituída`).not.toContain("{{")
    }
  })
})

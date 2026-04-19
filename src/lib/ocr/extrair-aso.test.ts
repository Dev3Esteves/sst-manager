import { describe, it, expect } from "vitest"
import { extrairAso } from "./extrair-aso"

describe("extrairAso", () => {
  it("extrai campos de ASO em formato padrão", () => {
    const texto = `
      CLÍNICA MÉDICA OCUPACIONAL LTDA
      Rua das Flores, 123 - São Paulo/SP

      ATESTADO DE SAÚDE OCUPACIONAL
      ASO nº 12345

      Nome: JOÃO DA SILVA
      CPF: 111.444.777-35
      Tipo de Exame: Admissional
      Data do Exame: 15/04/2026
      Validade: 15/04/2027
      Resultado: Apto

      Dr. Carlos Pereira
      CRM/SP 123456
    `
    const r = extrairAso(texto)
    expect(r.cpf).toBe("111.444.777-35")
    expect(r.numero_aso).toBe("12345")
    expect(r.tipo).toBe("admissional")
    expect(r.resultado).toBe("apto")
    expect(r.data_realizacao).toBe("2026-04-15")
    expect(r.data_vencimento).toBe("2027-04-15")
    expect(r.crm).toBe("123456/SP")
    expect(r.clinica).toContain("CLÍNICA MÉDICA")
  })

  it("normaliza CPF sem pontuação", () => {
    const r = extrairAso("CPF: 11144477735")
    expect(r.cpf).toBe("111.444.777-35")
  })

  it("rejeita CPF inválido 111.111.111-11", () => {
    const r = extrairAso("CPF: 111.111.111-11")
    expect(r.cpf).toBeNull()
  })

  it("reconhece 'apto com restrição' antes de 'apto'", () => {
    const texto = "Resultado: Apto com restrição para trabalho em altura"
    const r = extrairAso(texto)
    expect(r.resultado).toBe("apto_restricao")
  })

  it("reconhece inapto", () => {
    expect(extrairAso("Resultado: INAPTO").resultado).toBe("inapto")
  })

  it("reconhece vários tipos de exame", () => {
    expect(extrairAso("Tipo: Admissional").tipo).toBe("admissional")
    expect(extrairAso("Tipo: Periódico").tipo).toBe("periodico")
    expect(extrairAso("Exame demissional").tipo).toBe("demissional")
    expect(extrairAso("Retorno ao Trabalho").tipo).toBe("retorno_trabalho")
    expect(extrairAso("Mudança de Função").tipo).toBe("mudanca_funcao")
    expect(extrairAso("Exame complementar").tipo).toBe("complementar")
  })

  it("extrai CRM em múltiplos formatos", () => {
    expect(extrairAso("CRM/SP 123456").crm).toBe("123456/SP")
    expect(extrairAso("CRM-RJ 98765").crm).toBe("98765/RJ")
    expect(extrairAso("CRM 12345/MG").crm).toBe("12345/MG")
    expect(extrairAso("CRM: 45678").crm).toBe("45678")
  })

  it("primeira data é realização, segunda é vencimento", () => {
    const r = extrairAso("Exame: 10/01/2026\nValidade: 10/01/2027")
    expect(r.data_realizacao).toBe("2026-01-10")
    expect(r.data_vencimento).toBe("2027-01-10")
  })

  it("com apenas 1 data, preenche só realização", () => {
    const r = extrairAso("Realizado em 05/03/2026")
    expect(r.data_realizacao).toBe("2026-03-05")
    expect(r.data_vencimento).toBeNull()
  })

  it("data inválida é rejeitada", () => {
    const r = extrairAso("Data: 32/13/2026") // dia 32, mês 13
    expect(r.data_realizacao).toBeNull()
  })

  it("retorna todos nulls para texto vazio/irrelevante", () => {
    const r = extrairAso("lorem ipsum dolor sit amet")
    expect(r.cpf).toBeNull()
    expect(r.crm).toBeNull()
    expect(r.tipo).toBeNull()
    expect(r.resultado).toBeNull()
    expect(r.data_realizacao).toBeNull()
    expect(r.data_vencimento).toBeNull()
  })

  it("lida com caracteres de ruído de OCR (| vira I)", () => {
    // OCR freqüentemente confunde | com I
    const r = extrairAso("CPF: 111.444.777-35 | Tipo: Adm|ss|onal")
    expect(r.cpf).toBe("111.444.777-35")
    expect(r.tipo).toBe("admissional")
  })
})

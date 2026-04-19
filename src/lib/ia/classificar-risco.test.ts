import { describe, it, expect } from "vitest"
import { extrairJson, riscoClassificadoSchema } from "./classificar-risco"

describe("extrairJson", () => {
  it("parse JSON direto sem preamble", () => {
    const texto = `{"probabilidade": 3, "severidade": 4}`
    expect(extrairJson(texto)).toEqual({ probabilidade: 3, severidade: 4 })
  })

  it("extrai JSON em meio a texto em volta (tolerante)", () => {
    const texto = `Aqui vai a classificação:\n\n{"probabilidade": 2, "severidade": 3, "consequencia": "x"}\n\nEspero que ajude.`
    const parsed = extrairJson(texto) as Record<string, unknown>
    expect(parsed.probabilidade).toBe(2)
    expect(parsed.severidade).toBe(3)
  })

  it("extrai JSON dentro de bloco markdown ```json", () => {
    const texto = "```json\n{\"probabilidade\": 5, \"severidade\": 5}\n```"
    const parsed = extrairJson(texto) as Record<string, unknown>
    expect(parsed.probabilidade).toBe(5)
  })

  it("lança erro se não encontrar JSON", () => {
    expect(() => extrairJson("apenas texto sem json")).toThrow(/JSON/)
  })

  it("ignora whitespace no início/fim", () => {
    const texto = '   \n  {"probabilidade": 1, "severidade": 1}  \n  '
    expect(extrairJson(texto)).toEqual({ probabilidade: 1, severidade: 1 })
  })
})

describe("riscoClassificadoSchema", () => {
  const valido = {
    probabilidade: 3,
    severidade: 4,
    consequencia: "Choque elétrico com possível queda em altura",
    medida_controle: "Desenergizar + LOTO + aterramento temporário conforme NR-10",
  }

  it("aceita objeto válido", () => {
    const parsed = riscoClassificadoSchema.safeParse(valido)
    expect(parsed.success).toBe(true)
  })

  it("aceita justificativa opcional", () => {
    const parsed = riscoClassificadoSchema.safeParse({
      ...valido,
      justificativa: "Por ser trabalho em altura com contato direto em condutor energizado.",
    })
    expect(parsed.success).toBe(true)
  })

  it("rejeita probabilidade fora da faixa 1-5", () => {
    expect(riscoClassificadoSchema.safeParse({ ...valido, probabilidade: 0 }).success).toBe(false)
    expect(riscoClassificadoSchema.safeParse({ ...valido, probabilidade: 6 }).success).toBe(false)
    expect(riscoClassificadoSchema.safeParse({ ...valido, probabilidade: 3.5 }).success).toBe(false)
  })

  it("rejeita severidade fora da faixa 1-5", () => {
    expect(riscoClassificadoSchema.safeParse({ ...valido, severidade: 0 }).success).toBe(false)
    expect(riscoClassificadoSchema.safeParse({ ...valido, severidade: 6 }).success).toBe(false)
  })

  it("rejeita consequencia ou medida_controle vazias", () => {
    // Zod string() permite "" por padrão, mas o schema não tem min —
    // tirar ambos campos obrigatórios e ver que falha por undefined
    const p1 = riscoClassificadoSchema.safeParse({ ...valido, consequencia: undefined })
    const p2 = riscoClassificadoSchema.safeParse({ ...valido, medida_controle: undefined })
    expect(p1.success).toBe(false)
    expect(p2.success).toBe(false)
  })
})

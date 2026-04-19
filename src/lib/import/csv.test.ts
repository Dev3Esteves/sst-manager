import { describe, it, expect } from "vitest"
import { parseCsv, csvToObjects, detectDelimiter, normalizeKey, objectsToCsv } from "./csv"

describe("detectDelimiter", () => {
  it("detecta vírgula", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",")
  })
  it("detecta ponto-e-vírgula (comum em Excel pt-BR)", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";")
  })
  it("detecta tab", () => {
    expect(detectDelimiter("a\tb\tc")).toBe("\t")
  })
  it("prefere ; quando ambos presentes (Excel brasileiro)", () => {
    expect(detectDelimiter("nome;cpf;email@x.com")).toBe(";")
  })
})

describe("parseCsv", () => {
  it("parseia CSV simples", () => {
    expect(parseCsv("a,b\n1,2\n3,4")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]])
  })

  it("lida com aspas duplas", () => {
    expect(parseCsv('nome,obs\n"João, Silva","diz ""olá"""'))
      .toEqual([["nome", "obs"], ["João, Silva", 'diz "olá"']])
  })

  it("remove BOM UTF-8", () => {
    const comBom = "\ufeffa,b\n1,2"
    expect(parseCsv(comBom)).toEqual([["a", "b"], ["1", "2"]])
  })

  it("suporta CRLF", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([["a", "b"], ["1", "2"]])
  })

  it("ignora linhas vazias", () => {
    expect(parseCsv("a,b\n\n1,2\n\n")).toEqual([["a", "b"], ["1", "2"]])
  })

  it("respeita delimitador explícito", () => {
    expect(parseCsv("a|b\n1|2", "|")).toEqual([["a", "b"], ["1", "2"]])
  })
})

describe("csvToObjects", () => {
  it("usa primeira linha como chaves e normaliza", () => {
    const rows = [
      ["Nome Completo", "CPF", "E-mail"],
      ["João", "111.444.777-35", "joao@x.com"],
    ]
    expect(csvToObjects(rows)).toEqual([
      { nome_completo: "João", cpf: "111.444.777-35", email: "joao@x.com" },
    ])
  })

  it("retorna array vazio quando sem dados", () => {
    expect(csvToObjects([["a", "b"]])).toEqual([])
    expect(csvToObjects([])).toEqual([])
  })

  it("lida com células ausentes (trailing commas)", () => {
    const rows = [["a", "b", "c"], ["1", "2"]]
    expect(csvToObjects(rows)).toEqual([{ a: "1", b: "2", c: "" }])
  })
})

describe("normalizeKey", () => {
  it("remove acentos e normaliza", () => {
    expect(normalizeKey("Razão Social")).toBe("razao_social")
    expect(normalizeKey("Nº Matrícula")).toBe("n_matricula")
    expect(normalizeKey("E-MAIL")).toBe("email")
  })
})

describe("objectsToCsv", () => {
  it("serializa com cabeçalho", () => {
    const r = objectsToCsv([{ a: "1", b: "x" }, { a: "2", b: "y" }])
    expect(r).toBe("a,b\n1,x\n2,y")
  })

  it("escapa vírgulas e aspas", () => {
    const r = objectsToCsv([{ nome: "Silva, João", obs: 'diz "oi"' }])
    expect(r).toBe('nome,obs\n"Silva, João","diz ""oi"""')
  })

  it("respeita ordem de headers", () => {
    const r = objectsToCsv([{ a: "1", b: "2" }], ["b", "a"])
    expect(r).toBe("b,a\n2,1")
  })
})

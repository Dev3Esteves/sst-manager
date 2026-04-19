import type { z } from "zod"
import { parseCsv, csvToObjects, objectsToCsv } from "./csv"
import type { ImportSchema, LinhaResultado } from "./types"

/** Aplica aliases: se a chave canônica não existe mas um alias sim, renomeia. */
function aplicarAliases(
  obj: Record<string, string>,
  colunas: ImportSchema<z.ZodTypeAny>["colunas"],
): Record<string, string> {
  const out: Record<string, string> = { ...obj }
  for (const col of colunas) {
    if (out[col.key]) continue
    for (const alias of col.aliases ?? []) {
      if (out[alias]) {
        out[col.key] = out[alias]
        break
      }
    }
  }
  return out
}

/** Aplica o transformer `parse` de cada coluna (se definido) antes do Zod. */
function aplicarParse(
  obj: Record<string, string>,
  colunas: ImportSchema<z.ZodTypeAny>["colunas"],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj }
  for (const col of colunas) {
    if (col.parse && typeof out[col.key] === "string") {
      out[col.key] = col.parse(out[col.key] as string)
    }
  }
  return out
}

/**
 * Pipeline: texto CSV → lista de resultados (cada linha válida ou inválida).
 * Cliente decide o que fazer com os válidos (ex: inserir no DB).
 */
export function processarCsv<TSchema extends z.ZodTypeAny>(
  csvText: string,
  schema: ImportSchema<TSchema>,
): {
  resultados: LinhaResultado<z.infer<TSchema>>[]
  totalLinhas: number
  validos: z.infer<TSchema>[]
  invalidos: LinhaResultado<z.infer<TSchema>>[]
} {
  const rows = parseCsv(csvText)
  const objetos = csvToObjects(rows)

  const resultados: LinhaResultado<z.infer<TSchema>>[] = []

  objetos.forEach((obj, i) => {
    const linha = i + 2 // +2: linha 1 é cabeçalho, index 0 = linha 2 do arquivo
    const normalizado = aplicarAliases(obj, schema.colunas)
    const transformado = aplicarParse(normalizado, schema.colunas)
    const parsed = schema.schema.safeParse(transformado)

    if (parsed.success) {
      resultados.push({ ok: true, linha, valor: parsed.data })
    } else {
      const erros = parsed.error.errors.map(
        (e) => `${e.path.join(".") || "campo"}: ${e.message}`,
      )
      resultados.push({ ok: false, linha, erros, original: obj })
    }
  })

  return {
    resultados,
    totalLinhas: resultados.length,
    validos: resultados.filter((r) => r.ok).map((r) => (r as Extract<typeof r, { ok: true }>).valor),
    invalidos: resultados.filter((r) => !r.ok),
  }
}

/** Gera CSV template com cabeçalhos + 1 linha de exemplo. */
export function gerarTemplate(schema: ImportSchema<z.ZodTypeAny>): string {
  const headers = schema.colunas.map((c) => c.label)
  const exemplo = schema.colunas.map((c) => c.exemplo)
  const rows = [
    headers.reduce<Record<string, string>>((acc, h, i) => ({ ...acc, [h]: exemplo[i] }), {}),
  ]
  return objectsToCsv(rows, headers, ",")
}

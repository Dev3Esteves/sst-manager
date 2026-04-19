// Parser CSV enxuto, sem dependência externa.
// Suporta: delimitadores (, ; \t), aspas duplas com escape (""), CRLF/LF,
// BOM UTF-8, e detecção automática de delimitador.

/** Detecta o delimitador mais provável na primeira linha não-vazia. */
export function detectDelimiter(text: string): "," | ";" | "\t" {
  const sample = text.split(/\r?\n/).find((l) => l.trim())
  if (!sample) return ","
  const counts = {
    ",": (sample.match(/,/g) ?? []).length,
    ";": (sample.match(/;/g) ?? []).length,
    "\t": (sample.match(/\t/g) ?? []).length,
  }
  if (counts[";"] >= counts[","] && counts[";"] >= counts["\t"]) return ";"
  if (counts["\t"] > counts[","]) return "\t"
  return ","
}

/**
 * Parse CSV robusto.
 * Retorna array de linhas (array de células).
 * Primeira linha deve ser cabeçalho.
 */
export function parseCsv(input: string, delimiter?: string): string[][] {
  // Remove BOM
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const delim = delimiter ?? detectDelimiter(text)

  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        // "" dentro de aspas = aspas literal
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      cell += ch
      i++
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }

    if (ch === delim) {
      row.push(cell)
      cell = ""
      i++
      continue
    }

    if (ch === "\n" || ch === "\r") {
      row.push(cell)
      cell = ""
      // Só adiciona linha se não for vazia
      if (row.some((c) => c.length > 0)) rows.push(row)
      row = []
      // Consome \r\n juntos
      if (ch === "\r" && text[i + 1] === "\n") i++
      i++
      continue
    }

    cell += ch
    i++
  }

  // Última célula/linha
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    if (row.some((c) => c.length > 0)) rows.push(row)
  }

  return rows
}

/**
 * Transforma array de arrays em array de objetos usando a primeira linha como chaves.
 * Normaliza chaves: lowercase, trim, sem acentos, _ no lugar de espaços.
 */
export function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return []
  const headers = rows[0].map(normalizeKey)
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? "").trim()
    })
    return obj
  })
}

export function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
}

/** Serializa um array de objetos para CSV. Primeira chave/valor vira cabeçalho. */
export function objectsToCsv<T extends Record<string, string | number | null | undefined>>(
  rows: T[],
  headers?: (keyof T)[],
  delimiter = ",",
): string {
  if (rows.length === 0) return ""
  const keys = headers ?? (Object.keys(rows[0]) as (keyof T)[])
  const escape = (v: string | number | null | undefined): string => {
    const s = v === null || v === undefined ? "" : String(v)
    if (s.includes(delimiter) || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const linhas = [
    keys.join(delimiter),
    ...rows.map((r) => keys.map((k) => escape(r[k])).join(delimiter)),
  ]
  return linhas.join("\n")
}

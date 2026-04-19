import type { z } from "zod"

/** Definição de um mapa de colunas para uma entidade importável. */
export type ColumnSpec<T> = {
  /** Chave do objeto de entrada (já normalizada via normalizeKey). */
  key: string
  /** Rótulo amigável mostrado ao usuário no template e preview. */
  label: string
  /** Aceita sinônimos — se o usuário usou outro nome de coluna. */
  aliases?: string[]
  /** Transforma string bruta em valor tipado (trim, parse number, etc.). */
  parse?: (raw: string) => unknown
  /** Obrigatório para gerar o template. */
  exemplo: string
  /** Se true, sinaliza obrigatório na UI (não bloqueia — Zod decide). */
  obrigatorio?: boolean
  /** @internal — ajuda tipar ColumnSpec quando T é o tipo da linha. */
  _phantom?: T
}

export type ImportSchema<TSchema extends z.ZodTypeAny> = {
  /** Entidade legível — ex: "colaboradores" */
  nome: string
  /** Schema Zod que valida uma LINHA pós-parsing. */
  schema: TSchema
  /** Especificação das colunas (para template + normalização). */
  colunas: ColumnSpec<z.infer<TSchema>>[]
  /** Nome do arquivo CSV template. */
  templateFilename: string
}

export type LinhaResultado<T> =
  | { ok: true; linha: number; valor: T }
  | { ok: false; linha: number; erros: string[]; original: Record<string, string> }

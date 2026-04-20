/**
 * Padrão unificado de retorno para Server Actions, route handlers e serviços
 * de domínio. Discriminated union: `ok` decide se tem `data` ou `error`.
 *
 * Uso típico em Server Action:
 *
 * ```ts
 * export async function criarColaborador(input: X): Promise<Result<{ id: string }>> {
 *   const parsed = schema.safeParse(input)
 *   if (!parsed.success) return errFields(parsed.error.flatten().fieldErrors)
 *   const { error, data } = await supabase.from("...").insert(parsed.data).select().single()
 *   if (error) return err(error.message)
 *   return ok({ id: data.id })
 * }
 * ```
 *
 * Vantagem: o chamador sempre testa `result.ok` antes de acessar `.data`,
 * matando uma classe inteira de bugs em que o UI tentava usar dados num
 * fluxo de erro. TypeScript narrowing força isso.
 */

export type FieldErrors = Record<string, string[] | undefined>

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors }

/** Sucesso sem payload (ex.: delete, update). */
export type ResultVoid = Result<void>

/** Helper curto para sucesso. */
export function ok<T>(data: T): Result<T>
export function ok(): Result<void>
export function ok<T>(data?: T): Result<T> {
  return { ok: true, data: data as T }
}

/** Helper curto para erro genérico (sem field errors). */
export function err(message: string, fieldErrors?: FieldErrors): Result<never> {
  return { ok: false, error: message, fieldErrors }
}

/**
 * Erro a partir do `.flatten().fieldErrors` do Zod. Usa a primeira mensagem
 * de campo como `error` principal (fallback: "Dados inválidos").
 */
export function errFields(
  fieldErrors: FieldErrors,
  fallbackMessage = "Dados inválidos",
): Result<never> {
  const firstField = Object.keys(fieldErrors).find((k) => fieldErrors[k]?.length)
  const firstMsg = firstField ? fieldErrors[firstField]?.[0] : undefined
  return { ok: false, error: firstMsg ?? fallbackMessage, fieldErrors }
}

/**
 * Type guards — úteis quando queremos narrowing em helpers genéricos.
 */
export function isOk<T>(r: Result<T>): r is { ok: true; data: T } {
  return r.ok === true
}
export function isErr<T>(r: Result<T>): r is { ok: false; error: string; fieldErrors?: FieldErrors } {
  return r.ok === false
}

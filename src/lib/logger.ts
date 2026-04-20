/**
 * Logger estruturado em JSON.
 *
 * Por quê:
 *   - Logs como `console.log("Colab X foi criado por Y")` são ruins para
 *     filtrar/agregar no Vercel Logs. JSON permite query por campo.
 *   - Cada linha é um objeto `{ level, ts, msg, ...context }`.
 *   - O contexto sobe via `requestId`, `route`, `userId`, `empresaId` —
 *     campos estáveis que os filtros esperam encontrar.
 *
 * Uso:
 *   import { logger } from "@/lib/logger"
 *   logger.info("Lote gerado", { route: "documentos/lote", count: 12 })
 *
 * Para amarrar vários logs de uma mesma request:
 *   const log = logger.child({ requestId, route: "documentos/lote" })
 *   log.info("start")
 *   log.info("done", { durationMs: 342 })
 *
 * Escolha consciente:
 *   - Não usamos Pino/Winston. Dependência a mais só pra emitir JSON é overkill.
 *   - Em produção (Vercel), `console.log` já vira linha no log agregado; em dev,
 *     o operator prefere texto legível — por isso temos `format: "pretty"` quando
 *     `NODE_ENV !== "production"`.
 *   - Campos sensíveis (cpf, email, senha, token) são redated automaticamente.
 *
 * Retorno: `log.time("label")` retorna uma função `end(extra?)` que loga
 * `durationMs` quando chamada — padrão comum para timing de operações.
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

type LogContext = Record<string, unknown>

/** Campos que nunca devem aparecer no log — redated para "[REDACTED]". */
const PII_KEYS = new Set([
  "cpf",
  "cnpj",
  "email",
  "password",
  "senha",
  "token",
  "authorization",
  "cookie",
  "access_token",
  "refresh_token",
  "api_key",
  "secret",
])

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function currentMinLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || "").toLowerCase()
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") return raw
  return process.env.NODE_ENV === "production" ? "info" : "debug"
}

function isPrettyFormat(): boolean {
  if (process.env.LOG_FORMAT === "json") return false
  if (process.env.LOG_FORMAT === "pretty") return true
  return process.env.NODE_ENV !== "production"
}

/**
 * Remove campos PII de objetos arbitrários. Recursivo, mas com limite de
 * profundidade pra não travar em estruturas cíclicas.
 */
export function redactPii(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth-limit]"
  if (value === null || value === undefined) return value
  if (typeof value !== "object") return value

  if (Array.isArray(value)) {
    return value.map((v) => redactPii(v, depth + 1))
  }

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]"
    } else {
      out[k] = redactPii(v, depth + 1)
    }
  }
  return out
}

/**
 * Converte Error em objeto serializável — incluindo `stack` (truncado) e
 * `cause` recursivamente. Sem isso, `JSON.stringify(err)` retorna "{}".
 */
function serializeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return { value: String(err) }
  }
  const out: Record<string, unknown> = {
    name: err.name,
    message: err.message,
  }
  if (err.stack) {
    // Primeiras 10 linhas bastam — stacks enormes poluem logs.
    out.stack = err.stack.split("\n").slice(0, 10).join("\n")
  }
  const cause = (err as Error & { cause?: unknown }).cause
  if (cause) out.cause = serializeError(cause)
  return out
}

function emit(level: LogLevel, msg: string, ctx: LogContext) {
  if (LEVEL_RANK[level] < LEVEL_RANK[currentMinLevel()]) return

  const redacted = redactPii(ctx) as Record<string, unknown>
  const entry: Record<string, unknown> = {
    level,
    ts: new Date().toISOString(),
    msg,
    ...redacted,
  }

  if (isPrettyFormat()) {
    // Em dev: `[info] 10:12:34 documentos/lote: Lote gerado { count: 12 }`
    const short = new Date(entry.ts as string).toISOString().slice(11, 19)
    const rest = Object.fromEntries(
      Object.entries(entry).filter(([k]) => !["level", "ts", "msg"].includes(k)),
    )
    const body = Object.keys(rest).length > 0 ? " " + JSON.stringify(rest) : ""
    const line = `[${level}] ${short} ${msg}${body}`
    pickConsole(level)(line)
  } else {
    pickConsole(level)(JSON.stringify(entry))
  }
}

function pickConsole(level: LogLevel): (msg: string) => void {
  if (level === "error") return console.error
  if (level === "warn") return console.warn
  if (level === "debug") return console.debug
  return console.log
}

export interface Logger {
  debug(msg: string, ctx?: LogContext): void
  info(msg: string, ctx?: LogContext): void
  warn(msg: string, ctx?: LogContext): void
  error(msg: string, ctx?: LogContext): void
  /** Loga o erro serializado + contexto. Aceita `unknown` — útil em catch. */
  exception(msg: string, err: unknown, ctx?: LogContext): void
  /** Cria um filho com contexto base herdado por toda chamada. */
  child(bound: LogContext): Logger
  /**
   * Começa um span de tempo. Retorna função que, ao ser chamada, loga um
   * evento `info` com `durationMs`.
   *
   * Ex: `const end = log.time("gerar-pdf"); ...; end({ pages: 7 })`
   */
  time(label: string, ctx?: LogContext): (extra?: LogContext) => number
}

function make(baseCtx: LogContext): Logger {
  return {
    debug: (msg, ctx) => emit("debug", msg, { ...baseCtx, ...ctx }),
    info: (msg, ctx) => emit("info", msg, { ...baseCtx, ...ctx }),
    warn: (msg, ctx) => emit("warn", msg, { ...baseCtx, ...ctx }),
    error: (msg, ctx) => emit("error", msg, { ...baseCtx, ...ctx }),
    exception: (msg, err, ctx) =>
      emit("error", msg, { ...baseCtx, ...ctx, error: serializeError(err) }),
    child: (bound) => make({ ...baseCtx, ...bound }),
    time: (label, ctx) => {
      const started = Date.now()
      return (extra?: LogContext) => {
        const durationMs = Date.now() - started
        emit("info", label, { ...baseCtx, ...ctx, ...extra, durationMs })
        return durationMs
      }
    },
  }
}

/** Logger singleton. Use `.child(...)` para criar um escopo. */
export const logger: Logger = make({})

/**
 * Gera um requestId curto (8 hex chars) — suficiente pra correlacionar logs
 * dentro de uma janela razoável, e curto o bastante pra caber em headers e
 * mensagens de erro visíveis ao usuário.
 */
export function newRequestId(): string {
  const buf = new Uint8Array(4)
  globalThis.crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Helper pra instrumentar uma route handler: cria o logger escopado,
 * mede duração e loga exceção automaticamente.
 *
 * Uso:
 * ```
 * export async function POST(req: Request) {
 *   return withRouteLogging("documentos/lote", req, async (log) => {
 *     log.info("start")
 *     // ...
 *     return NextResponse.json(...)
 *   })
 * }
 * ```
 *
 * A response recebe `x-request-id` automaticamente.
 */
export async function withRouteLogging(
  route: string,
  req: Request,
  handler: (log: Logger, requestId: string) => Promise<Response>,
): Promise<Response> {
  const incomingId = req.headers.get("x-request-id")
  const requestId = incomingId && /^[a-f0-9]{4,32}$/i.test(incomingId)
    ? incomingId
    : newRequestId()
  const log = logger.child({ route, requestId, method: req.method })
  const end = log.time(`${route} done`)

  try {
    const res = await handler(log, requestId)
    end({ status: res.status })
    // Anexa x-request-id pra debug pelo operador
    try {
      res.headers.set("x-request-id", requestId)
    } catch {
      // Response imutável (rara) — ignora silenciosamente
    }
    return res
  } catch (err) {
    log.exception(`${route} threw`, err)
    throw err
  }
}

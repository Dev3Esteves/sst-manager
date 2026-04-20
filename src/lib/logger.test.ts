/**
 * Testes do logger estruturado.
 *
 * Foco: shape do JSON emitido, redação de PII, níveis, timing, e o helper
 * `withRouteLogging` (incluindo propagação de x-request-id).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { logger, newRequestId, redactPii, withRouteLogging } from "./logger"

describe("redactPii()", () => {
  it("oculta cpf, email, senha, token em objetos planos", () => {
    const out = redactPii({
      nome: "Alex",
      cpf: "11144477735",
      email: "alex@x.com",
      senha: "s3gr3d0",
      token: "Bearer abc",
    }) as Record<string, unknown>
    expect(out.nome).toBe("Alex")
    expect(out.cpf).toBe("[REDACTED]")
    expect(out.email).toBe("[REDACTED]")
    expect(out.senha).toBe("[REDACTED]")
    expect(out.token).toBe("[REDACTED]")
  })

  it("redige em profundidade (nested objects)", () => {
    const out = redactPii({
      user: { id: "u1", email: "x@y.com", profile: { cpf: "123" } },
    }) as { user: { email: string; profile: { cpf: string } } }
    expect(out.user.email).toBe("[REDACTED]")
    expect(out.user.profile.cpf).toBe("[REDACTED]")
  })

  it("redige em arrays", () => {
    const out = redactPii([{ cpf: "1" }, { cpf: "2" }]) as Array<{ cpf: string }>
    expect(out[0].cpf).toBe("[REDACTED]")
    expect(out[1].cpf).toBe("[REDACTED]")
  })

  it("preserva valores não-PII", () => {
    const out = redactPii({ count: 42, active: true, list: [1, 2] })
    expect(out).toEqual({ count: 42, active: true, list: [1, 2] })
  })

  it("trata null/undefined sem crashar", () => {
    expect(redactPii(null)).toBeNull()
    expect(redactPii(undefined)).toBeUndefined()
  })
})

describe("logger emission (JSON format)", () => {
  let originalFormat: string | undefined

  beforeEach(() => {
    originalFormat = process.env.LOG_FORMAT
    // Força JSON format mesmo em dev — não tentamos mexer em NODE_ENV
    // porque é readonly nos typings do Node 20+.
    process.env.LOG_FORMAT = "json"
  })

  afterEach(() => {
    if (originalFormat === undefined) delete process.env.LOG_FORMAT
    else process.env.LOG_FORMAT = originalFormat
    vi.restoreAllMocks()
  })

  it("info emite JSON com level, ts, msg e contexto", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("Teste de info", { foo: "bar" })
    expect(spy).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(payload.level).toBe("info")
    expect(payload.msg).toBe("Teste de info")
    expect(payload.foo).toBe("bar")
    expect(typeof payload.ts).toBe("string")
    // ISO timestamp
    expect(new Date(payload.ts as string).toISOString()).toBe(payload.ts)
  })

  it("error vai pro console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    logger.error("Falhou!", { code: "X" })
    expect(spy).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(payload.level).toBe("error")
    expect(payload.code).toBe("X")
  })

  it("warn vai pro console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    logger.warn("atenção")
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("exception serializa Error com stack e message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      throw new Error("boom")
    } catch (e) {
      logger.exception("Falha genérica", e, { route: "x" })
    }
    const payload = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(payload.msg).toBe("Falha genérica")
    expect(payload.route).toBe("x")
    expect(payload.error.message).toBe("boom")
    expect(payload.error.name).toBe("Error")
    expect(typeof payload.error.stack).toBe("string")
  })

  it("redige PII em contexto automaticamente", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("novo usuário", { userId: "u1", email: "x@y.com", cpf: "111" })
    const payload = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(payload.userId).toBe("u1")
    expect(payload.email).toBe("[REDACTED]")
    expect(payload.cpf).toBe("[REDACTED]")
  })

  it("child() herda contexto base em todas chamadas", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    const scoped = logger.child({ requestId: "abc123", route: "test/ep" })
    scoped.info("evento 1")
    scoped.info("evento 2", { extra: true })
    const p1 = JSON.parse(spy.mock.calls[0]![0] as string)
    const p2 = JSON.parse(spy.mock.calls[1]![0] as string)
    expect(p1.requestId).toBe("abc123")
    expect(p1.route).toBe("test/ep")
    expect(p2.requestId).toBe("abc123")
    expect(p2.extra).toBe(true)
  })

  it("time() retorna função que loga durationMs", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    const end = logger.time("operacao-x")
    await new Promise((r) => setTimeout(r, 5))
    const ms = end({ rows: 3 })
    expect(ms).toBeGreaterThanOrEqual(4)
    const payload = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(payload.msg).toBe("operacao-x")
    expect(payload.rows).toBe(3)
    expect(typeof payload.durationMs).toBe("number")
    expect(payload.durationMs).toBeGreaterThanOrEqual(4)
  })
})

describe("newRequestId()", () => {
  it("retorna 8 chars hexadecimais", () => {
    const id = newRequestId()
    expect(id).toMatch(/^[a-f0-9]{8}$/)
  })

  it("ids consecutivos são diferentes (não praticamente idênticos)", () => {
    const ids = new Set<string>()
    for (let i = 0; i < 50; i++) ids.add(newRequestId())
    // 50 amostras com 4 bytes de entropia — colisão praticamente impossível
    expect(ids.size).toBeGreaterThan(45)
  })
})

describe("withRouteLogging()", () => {
  let originalFormat: string | undefined

  beforeEach(() => {
    originalFormat = process.env.LOG_FORMAT
    process.env.LOG_FORMAT = "json"
  })

  afterEach(() => {
    if (originalFormat === undefined) delete process.env.LOG_FORMAT
    else process.env.LOG_FORMAT = originalFormat
    vi.restoreAllMocks()
  })

  it("injeta x-request-id no response headers", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    const req = new Request("http://test/", { method: "POST" })
    const res = await withRouteLogging("test/ep", req, async () => {
      return new Response("ok", { status: 200 })
    })
    const rid = res.headers.get("x-request-id")
    expect(rid).toMatch(/^[a-f0-9]{8}$/)
  })

  it("reutiliza x-request-id do cliente se for hex válido", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    const req = new Request("http://test/", {
      method: "POST",
      headers: { "x-request-id": "deadbeef" },
    })
    const res = await withRouteLogging("test/ep", req, async () => {
      return new Response("ok", { status: 200 })
    })
    expect(res.headers.get("x-request-id")).toBe("deadbeef")
  })

  it("loga start/done com durationMs e status", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    const req = new Request("http://test/", { method: "POST" })
    await withRouteLogging("test/ep", req, async (log) => {
      log.info("start")
      return new Response("ok", { status: 201 })
    })
    const starts = spy.mock.calls.map((c) => JSON.parse(c[0] as string))
    const done = starts.find((p) => p.msg === "test/ep done")
    expect(done).toBeDefined()
    expect(done.status).toBe(201)
    expect(typeof done.durationMs).toBe("number")
  })

  it("propaga throw e loga exception", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "log").mockImplementation(() => {})
    const req = new Request("http://test/", { method: "POST" })
    await expect(
      withRouteLogging("test/ep", req, async () => {
        throw new Error("falhou feio")
      }),
    ).rejects.toThrow("falhou feio")

    const payload = JSON.parse(errSpy.mock.calls[0]![0] as string)
    expect(payload.msg).toBe("test/ep threw")
    expect(payload.error.message).toBe("falhou feio")
  })
})

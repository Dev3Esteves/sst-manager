import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

/**
 * Recebe relatórios de erro do client-side e reemite no log estruturado
 * server-side (Vercel Logs / stderr).
 *
 * Escolhas conscientes:
 *   - **Não exigimos autenticação** — um erro de carregamento pode estourar
 *     antes do user estar logado (e perder esses erros é ruim). Em troca,
 *     limitamos drasticamente o tamanho do payload e redigimos qualquer
 *     campo PII no backend via `logger` (que já faz isso).
 *   - **Sem persistência** — só log. Se quiser histórico, promover pra tabela
 *     `client_errors` no futuro (#10 da backlog — audit log).
 *
 * Shape esperado:
 *   { source, message, stack?, digest?, path? }
 */
const MAX_BODY_BYTES = 32 * 1024 // 32 KB — stack trace normal cabe fácil

export async function POST(req: Request) {
  try {
    const text = await req.text()
    if (text.length > MAX_BODY_BYTES) {
      logger.warn("client-error report too large", { bytes: text.length })
      return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 })
    }

    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 })
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const p = payload as Record<string, unknown>
    const ua = req.headers.get("user-agent")?.slice(0, 200) ?? null
    const referer = req.headers.get("referer")?.slice(0, 500) ?? null

    logger.warn("client-error reported", {
      source: typeof p.source === "string" ? p.source : "unknown",
      message: typeof p.message === "string" ? p.message.slice(0, 500) : "",
      stack: typeof p.stack === "string" ? p.stack.slice(0, 4000) : null,
      digest: typeof p.digest === "string" ? p.digest : null,
      path: typeof p.path === "string" ? p.path.slice(0, 500) : null,
      userAgent: ua,
      referer,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Falha no próprio reporter não pode quebrar — engolir e loguar.
    logger.exception("client-error reporter failed", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

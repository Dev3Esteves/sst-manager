"use client"

/**
 * Captura erros *não* cobertos pelas error boundaries:
 *   - `window.onerror`        → exceções síncronas não capturadas
 *   - `unhandledrejection`    → promises rejeitadas sem .catch()
 *
 * Emite via `reportClientError` pro backend conseguir logar no Vercel.
 *
 * Este componente não renderiza nada — só tem side-effect. Montado no
 * `RootLayout` uma única vez.
 *
 * Escolha consciente: deduplicamos pelo par `(message, stack.slice(0,200))`
 * dentro de uma janela curta (5s) pra não inundar o endpoint se o mesmo
 * erro disparar em loop.
 */
import { useEffect } from "react"
import { reportClientError } from "@/lib/client-error-report"

export function ErrorCapture() {
  useEffect(() => {
    const recent = new Map<string, number>()
    const DEDUP_WINDOW_MS = 5000

    function shouldEmit(key: string): boolean {
      const now = Date.now()
      // Limpa expirados (mantém map pequeno) — usa Array.from pra ser
      // compatível com target ES5 sem downlevelIteration.
      Array.from(recent.entries()).forEach(([k, t]) => {
        if (now - t > DEDUP_WINDOW_MS) recent.delete(k)
      })
      if (recent.has(key)) return false
      recent.set(key, now)
      return true
    }

    function onError(ev: ErrorEvent) {
      const msg = ev.message ?? String(ev.error ?? "unknown")
      const stack = ev.error instanceof Error ? ev.error.stack ?? null : null
      const key = `${msg}|${(stack ?? "").slice(0, 200)}`
      if (!shouldEmit(key)) return
      reportClientError({
        source: "window-error",
        message: msg,
        stack,
        path: window.location.pathname,
      })
    }

    function onRejection(ev: PromiseRejectionEvent) {
      const reason = ev.reason
      const msg = reason instanceof Error ? reason.message : String(reason)
      const stack = reason instanceof Error ? reason.stack ?? null : null
      const key = `${msg}|${(stack ?? "").slice(0, 200)}`
      if (!shouldEmit(key)) return
      reportClientError({
        source: "unhandled-rejection",
        message: msg,
        stack,
        path: window.location.pathname,
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}

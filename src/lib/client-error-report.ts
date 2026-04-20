/**
 * Reporta erros do client-side pra /api/log/client pra que o backend consiga
 * emitir no log estruturado (Vercel Logs).
 *
 * Por quê:
 *   - console.error no browser só fica visível no devtools do usuário.
 *     A gente quer saber no log agregado do servidor quando um usuário
 *     bateu em um error boundary.
 *   - Usamos `navigator.sendBeacon` se disponível (não bloqueia unload da
 *     página); fallback para fetch keepalive.
 *
 * Não-goals:
 *   - Sampling/rate limit no client (backend tem limit próprio).
 *   - Retry em falha (um erro perdido > travar uma página que já tá em falha).
 */
export type ClientErrorReport = {
  source: "error-boundary" | "unhandled-rejection" | "window-error" | "manual"
  message: string
  stack?: string | null
  digest?: string | null
  path?: string | null
}

export function reportClientError(report: ClientErrorReport): void {
  if (typeof window === "undefined") return
  try {
    const payload = JSON.stringify(report)
    const url = "/api/log/client"

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" })
      const ok = navigator.sendBeacon(url, blob)
      if (ok) return
    }

    // Fallback: fetch com keepalive (sobrevive ao unload)
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* swallow — melhor perder um log do que crashar a página de erro */
    })
  } catch {
    /* swallow — report não pode piorar o estado da página */
  }
}

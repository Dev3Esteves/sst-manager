"use client"

/**
 * Último recurso — captura erros que aconteceram ANTES do `app/layout.tsx`
 * conseguir renderizar (ex. erro no próprio layout raiz).
 *
 * O Next requer que este arquivo renderize sua própria <html>/<body>,
 * porque não há layout funcionando.
 *
 * Obs.: em dev o Next mostra sua overlay por cima disso; em prod, é o que o
 * usuário vê se a app quebrar antes do layout montar.
 */
import { useEffect } from "react"
import { logger } from "@/lib/logger"
import { reportClientError } from "@/lib/client-error-report"

export default function GlobalError({
  error, reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.exception("global-error boundary", error, {
      digest: error.digest,
      path: typeof window !== "undefined" ? window.location.pathname : null,
    })
    reportClientError({
      source: "error-boundary",
      message: error.message,
      stack: error.stack ?? null,
      digest: error.digest ?? null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
    })
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "40rem", margin: "4rem auto" }}>
        <h1 style={{ color: "#b91c1c", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          Erro crítico
        </h1>
        <p style={{ color: "#374151" }}>
          A aplicação encontrou uma falha antes mesmo de conseguir renderizar.
          Tente recarregar a página.
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#6b7280", marginTop: "0.75rem" }}>
            ID do erro: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#111827",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  )
}

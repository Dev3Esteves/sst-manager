"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertOctagon, RotateCcw } from "lucide-react"
import { logger } from "@/lib/logger"
import { reportClientError } from "@/lib/client-error-report"

export default function GlobalError({
  error, reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log estruturado local (browser devtools) + envio ao backend (Vercel Logs)
    logger.exception("app-error boundary", error, {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-lg w-full border-status-vencido">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertOctagon className="h-6 w-6 text-status-vencido shrink-0 mt-0.5" />
            <div>
              <CardTitle>Algo deu errado</CardTitle>
              <CardDescription className="mt-1">
                Uma falha inesperada aconteceu nesta página.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.digest && (
            <div className="text-xs font-mono bg-muted rounded p-2">
              ID do erro: {error.digest}
            </div>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded overflow-auto whitespace-pre-wrap break-all text-[11px]">
              {error.message}
            </pre>
          </details>
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button onClick={() => (window.location.href = "/dashboard")} variant="outline">
              Ir para Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

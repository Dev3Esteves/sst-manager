"use client"

import { useState, useTransition } from "react"
import { useOnline } from "@/hooks/use-online"
import { usePendingSync } from "@/hooks/use-pending-sync"
import { useBackgroundSync } from "@/hooks/use-background-sync"
import { syncAll } from "@/lib/offline/sync"
import { retryNow, discardMutation, discardAllPoison, type QueuedMutation } from "@/lib/offline/db"
import { Button } from "@/components/ui/button"
import { CloudOff, Cloud, RefreshCw, Loader2, AlertTriangle, X, ChevronDown, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfflineStatus() {
  const online = useOnline()
  const { pending, failed, poison, items } = usePendingSync()
  const [syncing, startSync] = useTransition()
  const [lastMsg, setLastMsg] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  // Sync automático em background + ao voltar online
  useBackgroundSync({
    intervalMs: 60_000,
    onSync: (r) => {
      if (r.total > 0 || r.retried > 0) {
        const parts = [`${r.synced}/${r.total} sincronizados`]
        if (r.retried > 0) parts.push(`${r.retried} retentados`)
        setLastMsg(parts.join(" · "))
        setTimeout(() => setLastMsg(null), 4000)
      }
    },
  })

  function doSyncNow() {
    startSync(async () => {
      const r = await syncAll()
      setLastMsg(`${r.synced}/${r.total} sincronizados${r.retried > 0 ? ` · ${r.retried} retentados` : ""}`)
      setTimeout(() => setLastMsg(null), 4000)
    })
  }

  async function handleRetry(id: number) {
    await retryNow(id)
    doSyncNow()
  }

  async function handleDiscard(id: number) {
    if (!confirm("Descartar esta mutação? O dado será perdido.")) return
    await discardMutation(id)
  }

  async function handleClearPoison() {
    if (!confirm(`Descartar ${poison} falha(s) permanente(s)? Os dados serão perdidos.`)) return
    await discardAllPoison()
  }

  const totalProblemas = pending + failed + poison

  // Nada a mostrar se online e sem pendências — evita ruído
  if (online && totalProblemas === 0 && !lastMsg) return null

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {!online && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-status-vencido/15 text-status-vencido px-2.5 py-1 text-xs font-medium">
            <CloudOff className="h-3.5 w-3.5" />
            Offline
          </span>
        )}

        {totalProblemas > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              poison > 0
                ? "bg-status-vencido/15 text-status-vencido hover:bg-status-vencido/25"
                : "bg-status-alerta/15 text-status-alerta hover:bg-status-alerta/25",
            )}
            aria-expanded={expanded}
            aria-label="Ver fila de sincronização"
          >
            {poison > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
            {totalProblemas} na fila
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          </button>
        )}

        {online && pending + failed > 0 && (
          <Button variant="ghost" size="sm" onClick={doSyncNow} disabled={syncing}>
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
        )}

        {lastMsg && (
          <span className="text-xs text-status-regular hidden sm:inline">{lastMsg}</span>
        )}
      </div>

      {expanded && totalProblemas > 0 && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setExpanded(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-2 z-40 w-[min(92vw,380px)] rounded-md border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <h3 className="text-sm font-semibold">Fila de sincronização</h3>
              <div className="flex items-center gap-1">
                {poison > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearPoison}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    title={`Descartar ${poison} falha(s) permanente(s)`}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline ml-1">Limpar falhas</span>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(false)} aria-label="Fechar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {poison > 0 && (
              <div className="border-b bg-status-vencido/10 px-3 py-2 text-xs">
                <strong className="text-status-vencido">
                  {poison} mutação(ões) com falha permanente
                </strong>
                <p className="text-muted-foreground mt-1">
                  Esgotaram 10 tentativas. Provavelmente há um problema de validação ou
                  configuração. Descarte manualmente após resolver.
                </p>
              </div>
            )}

            <ul className="max-h-[320px] overflow-y-auto divide-y">
              {items.length === 0 ? (
                <li className="px-3 py-4 text-xs text-muted-foreground text-center">
                  Fila vazia.
                </li>
              ) : (
                items
                  .sort((a, b) => {
                    const prio: Record<string, number> = { poison: 0, failed: 1, pending: 2, syncing: 3 }
                    return (prio[a.status] ?? 9) - (prio[b.status] ?? 9)
                  })
                  .map((m) => (
                    <MutationItem
                      key={m.id}
                      mutation={m}
                      onRetry={() => m.id && handleRetry(m.id)}
                      onDiscard={() => m.id && handleDiscard(m.id)}
                    />
                  ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function MutationItem({
  mutation: m,
  onRetry,
  onDiscard,
}: {
  mutation: QueuedMutation
  onRetry: () => void
  onDiscard: () => void
}) {
  const isPending = m.status === "pending"
  const isFailed = m.status === "failed"
  const isPoison = m.status === "poison"

  const statusLabel =
    isPending ? "Aguardando" :
    isFailed ? "Falha — retentando" :
    isPoison ? "Falha permanente" :
    m.status

  const statusColor =
    isPending ? "text-muted-foreground" :
    isFailed ? "text-status-alerta" :
    isPoison ? "text-status-vencido" :
    ""

  const waitMs = m.nextRetryAt ? m.nextRetryAt - Date.now() : 0
  const proximaTentativa =
    !isFailed || waitMs <= 0 ? null :
    waitMs < 60_000 ? "em menos de 1 min" :
    `em ${Math.round(waitMs / 60_000)} min`

  return (
    <li className="px-3 py-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono bg-muted rounded px-1.5 py-0.5">{m.type}</span>
            <span className={cn("font-medium", statusColor)}>{statusLabel}</span>
            {m.retryCount > 0 && (
              <span className="text-muted-foreground">· tentativa {m.retryCount}</span>
            )}
          </div>
          <div className="text-muted-foreground truncate mt-0.5" title={m.endpoint}>
            {m.endpoint}
          </div>
          {proximaTentativa && (
            <div className="text-muted-foreground mt-0.5">Próxima tentativa {proximaTentativa}</div>
          )}
          {m.lastError && (
            <div className="text-destructive mt-1 line-clamp-2" title={m.lastError}>
              {m.lastError}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {(isFailed || isPoison) && (
            <Button variant="ghost" size="icon" onClick={onRetry} className="h-7 w-7" title="Tentar agora">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onDiscard} className="h-7 w-7 text-destructive hover:text-destructive" title="Descartar">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  )
}

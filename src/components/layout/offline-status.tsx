"use client"

import { useEffect, useState, useTransition } from "react"
import { useOnline } from "@/hooks/use-online"
import { usePendingSync } from "@/hooks/use-pending-sync"
import { syncAll } from "@/lib/offline/sync"
import { Button } from "@/components/ui/button"
import { CloudOff, Cloud, RefreshCw, Loader2 } from "lucide-react"

export function OfflineStatus() {
  const online = useOnline()
  const { pending, failed } = usePendingSync()
  const [syncing, startSync] = useTransition()
  const [lastResult, setLastResult] = useState<string | null>(null)

  // Auto-sync quando voltar online
  useEffect(() => {
    if (online && pending > 0 && !syncing) {
      doSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, pending])

  function doSync() {
    startSync(async () => {
      const r = await syncAll()
      setLastResult(`${r.synced}/${r.total} sincronizados`)
      setTimeout(() => setLastResult(null), 4000)
    })
  }

  const totalLocal = pending + failed

  // Nada a mostrar se online e sem pendências — evita ruído
  if (online && totalLocal === 0 && !lastResult) return null

  return (
    <div className="flex items-center gap-2">
      {!online && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-vencido/15 text-status-vencido px-2.5 py-1 text-xs font-medium">
          <CloudOff className="h-3.5 w-3.5" />
          Offline
        </span>
      )}

      {totalLocal > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-alerta/15 text-status-alerta px-2.5 py-1 text-xs font-medium">
          <Cloud className="h-3.5 w-3.5" />
          {totalLocal} pendente{totalLocal > 1 ? "s" : ""}
        </span>
      )}

      {online && totalLocal > 0 && (
        <Button variant="ghost" size="sm" onClick={doSync} disabled={syncing}>
          {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Sincronizar</span>
        </Button>
      )}

      {lastResult && (
        <span className="text-xs text-status-regular">{lastResult}</span>
      )}
    </div>
  )
}

"use client"

import { useEffect, useRef } from "react"
import { syncAll, type SyncResult } from "@/lib/offline/sync"
import { useOnline } from "./use-online"

type Options = {
  /** Intervalo entre tentativas automáticas (ms). Default 60s. */
  intervalMs?: number
  /** Callback opcional chamado após cada sync bem-sucedido. */
  onSync?: (result: SyncResult) => void
}

/**
 * Sincroniza a fila offline em background:
 *   - Dispara imediatamente quando volta a ficar online (event `online` do window)
 *   - Roda periodicamente em intervalo configurável enquanto online
 *   - Usa `isSyncing` ref para garantir que não há runs sobrepostos
 *
 * Não faz nada se o usuário está offline — confia no evento `online` para
 * disparar o replay inicial. Evita bater no servidor quando sabidamente não dá.
 */
export function useBackgroundSync({ intervalMs = 60_000, onSync }: Options = {}) {
  const online = useOnline()
  const isSyncing = useRef(false)
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync

  useEffect(() => {
    let cancelled = false

    async function tick() {
      if (cancelled || isSyncing.current) return
      if (!navigator.onLine) return
      isSyncing.current = true
      try {
        const result = await syncAll()
        if (!cancelled) onSyncRef.current?.(result)
      } catch {
        // Falha do próprio syncAll (IndexedDB indisponível, etc.) — ignora
      } finally {
        isSyncing.current = false
      }
    }

    // Dispara logo ao montar se já estiver online — cobre o caso de abrir
    // a app com pendências acumuladas da sessão anterior.
    if (online) tick()

    const intervalId = setInterval(tick, intervalMs)
    const onOnline = () => tick()
    window.addEventListener("online", onOnline)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      window.removeEventListener("online", onOnline)
    }
  }, [intervalMs, online])
}

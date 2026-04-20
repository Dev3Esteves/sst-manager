"use client"

import { useEffect, useState } from "react"
import { countByStatus, listMutations, type QueuedMutation } from "@/lib/offline/db"

type Counts = {
  pending: number
  failed: number
  poison: number
  items: QueuedMutation[]
}

/**
 * Monitora a fila offline em polling curto. Expõe contadores por status +
 * a lista completa (para UI expansível). A lista é útil para mostrar ao
 * usuário o que está falhando e permitir ações individuais.
 */
export function usePendingSync(pollMs = 3000): Counts {
  const [state, setState] = useState<Counts>({ pending: 0, failed: 0, poison: 0, items: [] })

  useEffect(() => {
    let active = true
    async function refresh() {
      try {
        const [pending, failed, poison, all] = await Promise.all([
          countByStatus("pending"),
          countByStatus("failed"),
          countByStatus("poison"),
          listMutations(),
        ])
        if (!active) return
        setState({
          pending,
          failed,
          poison,
          // Filtra `syncing` transiente — não queremos mostrar "in-flight" na lista
          items: all.filter((m) => m.status !== "syncing"),
        })
      } catch {
        // IndexedDB indisponível (SSR ou Safari privado) — ignora
      }
    }
    refresh()
    const id = setInterval(refresh, pollMs)
    return () => { active = false; clearInterval(id) }
  }, [pollMs])

  return state
}

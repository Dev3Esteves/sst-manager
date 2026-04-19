"use client"

import { useEffect, useState } from "react"
import { countPending, listMutations } from "@/lib/offline/db"

export function usePendingSync(pollMs = 3000) {
  const [count, setCount] = useState<number>(0)
  const [failed, setFailed] = useState<number>(0)

  useEffect(() => {
    let active = true
    async function refresh() {
      try {
        const c = await countPending()
        const f = await listMutations("failed")
        if (!active) return
        setCount(c)
        setFailed(f.length)
      } catch {
        // IndexedDB indisponível (SSR ou Safari privado) — ignora
      }
    }
    refresh()
    const id = setInterval(refresh, pollMs)
    return () => { active = false; clearInterval(id) }
  }, [pollMs])

  return { pending: count, failed }
}

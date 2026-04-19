import { listMutations, markSyncing, markSynced, markFailed, clearSynced } from "./db"

type SyncResult = {
  total: number
  synced: number
  failed: number
}

/**
 * Replay mutations pendentes na ordem FIFO. Para no primeiro erro de rede
 * (para não queimar ciclos quando sabemos que estamos offline), mas continua
 * nos erros de validação (4xx) marcando o item como failed.
 */
export async function syncAll(): Promise<SyncResult> {
  const pending = await listMutations("pending")
  const result: SyncResult = { total: pending.length, synced: 0, failed: 0 }

  for (const m of pending.sort((a, b) => a.createdAt - b.createdAt)) {
    if (!m.id) continue
    await markSyncing(m.id)
    try {
      const res = await fetch(m.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(m.payload),
      })

      if (res.ok) {
        await markSynced(m.id)
        result.synced++
      } else if (res.status >= 400 && res.status < 500) {
        // Erro do cliente — payload inválido, não adianta repetir
        const body = await res.text()
        await markFailed(m.id, `HTTP ${res.status}: ${body.slice(0, 200)}`)
        result.failed++
      } else {
        // Erro do servidor — tentaremos de novo depois
        await markFailed(m.id, `HTTP ${res.status}`)
        result.failed++
        break // evita cascata se servidor está fora
      }
    } catch (err) {
      // Erro de rede (offline de novo, DNS, etc.) — volta pendente
      const msg = err instanceof Error ? err.message : String(err)
      await markFailed(m.id, msg)
      result.failed++
      break
    }
  }

  await clearSynced()
  return result
}

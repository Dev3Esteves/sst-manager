import {
  listMutations, markSyncing, markSynced, markFailed, promoteReadyToRetry,
} from "./db"

export type SyncResult = {
  total: number
  synced: number
  failed: number
  /** Itens `failed` que foram promovidos a `pending` pelo backoff e entraram nesta rodada */
  retried: number
}

/**
 * Replay das mutações pendentes.
 *
 * Fluxo:
 *  1. `promoteReadyToRetry()` — move `failed` cujo backoff já passou para `pending`
 *  2. Para cada `pending` (ordem FIFO por createdAt):
 *     - HTTP 2xx → `synced` (delete)
 *     - HTTP 4xx → `failed` com retry (payload inválido vai eventualmente virar `poison`)
 *     - HTTP 5xx → `failed`, interrompe o loop (evita ataque ao servidor caído)
 *     - Erro de rede → `failed`, interrompe o loop (provavelmente está offline de novo)
 *
 * Diferença pro antigo: `failed` não fica órfão — volta a `pending` quando
 * `nextRetryAt` expira. O backoff exponencial (db.ts `calcNextRetryDelay`)
 * garante que um endpoint persistentemente instável não queima ciclos.
 */
export async function syncAll(): Promise<SyncResult> {
  // 1. Promove o que já pode ser retentado
  const retried = await promoteReadyToRetry()

  // 2. Processa todos os `pending` (incluindo os que acabaram de ser promovidos)
  const pending = await listMutations("pending")
  const result: SyncResult = { total: pending.length, synced: 0, failed: 0, retried }

  const sorted = pending.sort((a, b) => a.createdAt - b.createdAt)

  for (const m of sorted) {
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
        // Erro do cliente — payload provavelmente inválido. Ainda assim
        // entra no backoff, pois poderia ser um bug temporário do servidor
        // (ex. schema desatualizado). Após MAX_RETRIES vira poison.
        const body = await res.text().catch(() => "")
        await markFailed(m.id, `HTTP ${res.status}: ${body.slice(0, 200)}`)
        result.failed++
      } else {
        // Erro do servidor — tentaremos de novo depois
        await markFailed(m.id, `HTTP ${res.status}`)
        result.failed++
        break // evita cascata se servidor está fora
      }
    } catch (err) {
      // Erro de rede (offline de novo, DNS, etc.)
      const msg = err instanceof Error ? err.message : String(err)
      await markFailed(m.id, msg)
      result.failed++
      break
    }
  }

  return result
}

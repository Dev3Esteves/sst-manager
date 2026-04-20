// IndexedDB wrapper para fila de mutações offline.
// Mantém pendências enquanto não há rede; replay com backoff ao reconectar.

import { openDB, type DBSchema, type IDBPDatabase } from "idb"

export type MutationType =
  | "inspecao"
  // adicione mais conforme for suportado: "ocorrencia" | "epi_entrega" etc.

/**
 * Ciclo de vida:
 *   pending  → seleção para sync
 *   syncing  → request em voo
 *   failed   → última tentativa falhou; será retentada quando nextRetryAt <= now
 *   poison   → esgotou tentativas (MAX_RETRIES); precisa de ação manual
 *
 * `synced` é intermediário — itens com sucesso são `delete`d pra manter o store enxuto.
 */
export type MutationStatus = "pending" | "syncing" | "failed" | "poison"

export type QueuedMutation = {
  id?: number
  type: MutationType
  endpoint: string // ex: /api/sync/inspecoes
  payload: unknown
  status: MutationStatus
  createdAt: number
  updatedAt: number
  retryCount: number
  /** Timestamp (ms epoch) antes do qual o item NÃO deve ser retentado. */
  nextRetryAt?: number
  lastError?: string
}

interface OfflineDB extends DBSchema {
  mutations: {
    key: number
    value: QueuedMutation
    indexes: { "by-status": string; "by-type": string }
  }
}

const DB_NAME = "sst-manager-offline"
// v2: adicionou campo nextRetryAt + status "poison"
const DB_VERSION = 2

/**
 * Política de backoff exponencial com jitter.
 *  - Base: 60s após a primeira falha
 *  - Dobra a cada tentativa: 60s, 120s, 240s, 480s, ...
 *  - Cap: 1 hora
 *  - Jitter: ±20% para evitar thundering herd quando muitas mutações falham juntas
 */
export function calcNextRetryDelay(retryCount: number): number {
  const baseMs = 60_000
  const capMs = 60 * 60_000
  const exp = Math.min(capMs, baseMs * Math.pow(2, Math.max(0, retryCount - 1)))
  const jitter = exp * (0.8 + Math.random() * 0.4) // 80% a 120%
  return Math.floor(jitter)
}

/** Após quantas tentativas consideramos o item "poison" (requer ação manual). */
export const MAX_RETRIES = 10

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null

export function getDb(): Promise<IDBPDatabase<OfflineDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB só roda no cliente"))
  }
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore("mutations", {
            keyPath: "id",
            autoIncrement: true,
          })
          store.createIndex("by-status", "status")
          store.createIndex("by-type", "type")
        }
        // v2: campos nextRetryAt / status "poison" são aditivos — não quebram
        // leitura antiga; migração é passiva, não precisa script.
      },
    })
  }
  return dbPromise
}

export async function enqueueMutation(
  m: Omit<QueuedMutation, "id" | "status" | "createdAt" | "updatedAt" | "retryCount">,
): Promise<number> {
  const db = await getDb()
  const now = Date.now()
  const id = await db.add("mutations", {
    ...m,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
  })
  return id as number
}

export async function listMutations(status?: QueuedMutation["status"]): Promise<QueuedMutation[]> {
  const db = await getDb()
  if (status) {
    return db.getAllFromIndex("mutations", "by-status", status)
  }
  return db.getAll("mutations")
}

export async function countPending(): Promise<number> {
  const db = await getDb()
  const idx = db.transaction("mutations").store.index("by-status")
  return idx.count("pending")
}

export async function countByStatus(status: MutationStatus): Promise<number> {
  const db = await getDb()
  const idx = db.transaction("mutations").store.index("by-status")
  return idx.count(status)
}

export async function markSyncing(id: number): Promise<void> {
  const db = await getDb()
  const item = await db.get("mutations", id)
  if (!item) return
  await db.put("mutations", { ...item, status: "syncing", updatedAt: Date.now() })
}

export async function markSynced(id: number): Promise<void> {
  const db = await getDb()
  await db.delete("mutations", id)
}

/**
 * Marca como `failed` e agenda retry com backoff exponencial.
 * Se retryCount atingir MAX_RETRIES, promove para `poison` (ação manual).
 */
export async function markFailed(id: number, error: string): Promise<void> {
  const db = await getDb()
  const item = await db.get("mutations", id)
  if (!item) return
  const retryCount = item.retryCount + 1
  const isPoison = retryCount >= MAX_RETRIES
  await db.put("mutations", {
    ...item,
    status: isPoison ? "poison" : "failed",
    updatedAt: Date.now(),
    retryCount,
    nextRetryAt: isPoison ? undefined : Date.now() + calcNextRetryDelay(retryCount),
    lastError: error,
  })
}

/**
 * Promove manualmente `failed` para `pending` (ignora o backoff) — para
 * quando o usuário clica "Tentar agora".
 */
export async function retryNow(id: number): Promise<void> {
  const db = await getDb()
  const item = await db.get("mutations", id)
  if (!item) return
  await db.put("mutations", {
    ...item,
    status: "pending",
    updatedAt: Date.now(),
    nextRetryAt: undefined,
  })
}

/**
 * Bulk: promove todos os `failed` cujo nextRetryAt já passou para `pending`.
 * Chamado automaticamente pelo `syncAll` a cada ciclo.
 */
export async function promoteReadyToRetry(now = Date.now()): Promise<number> {
  const db = await getDb()
  const failed = await db.getAllFromIndex("mutations", "by-status", "failed")
  let promoted = 0
  const tx = db.transaction("mutations", "readwrite")
  for (const m of failed) {
    if (!m.id) continue
    if (m.nextRetryAt === undefined || m.nextRetryAt <= now) {
      await tx.store.put({ ...m, status: "pending", updatedAt: Date.now(), nextRetryAt: undefined })
      promoted++
    }
  }
  await tx.done
  return promoted
}

/**
 * Descarta uma mutação (usado pelo usuário para limpar `poison` ou `failed`
 * que ele explicitamente quer descartar).
 */
export async function discardMutation(id: number): Promise<void> {
  const db = await getDb()
  await db.delete("mutations", id)
}

/**
 * Descarta todas as `poison` (botão "Limpar falhas permanentes").
 */
export async function discardAllPoison(): Promise<number> {
  const db = await getDb()
  const poison = await db.getAllFromIndex("mutations", "by-status", "poison")
  const tx = db.transaction("mutations", "readwrite")
  for (const m of poison) {
    if (m.id) await tx.store.delete(m.id)
  }
  await tx.done
  return poison.length
}

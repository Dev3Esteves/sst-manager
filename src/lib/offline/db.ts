// IndexedDB wrapper para fila de mutações offline.
// Mantém pendências enquanto não há rede; replay ao reconectar.

import { openDB, type DBSchema, type IDBPDatabase } from "idb"

export type MutationType =
  | "inspecao"
  // adicione mais conforme for suportado: "ocorrencia" | "epi_entrega" etc.

export type QueuedMutation = {
  id?: number
  type: MutationType
  endpoint: string // ex: /api/sync/inspecoes
  payload: unknown
  status: "pending" | "syncing" | "synced" | "failed"
  createdAt: number
  updatedAt: number
  retryCount: number
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
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null

export function getDb(): Promise<IDBPDatabase<OfflineDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB só roda no cliente"))
  }
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("mutations", {
          keyPath: "id",
          autoIncrement: true,
        })
        store.createIndex("by-status", "status")
        store.createIndex("by-type", "type")
      },
    })
  }
  return dbPromise
}

export async function enqueueMutation(m: Omit<QueuedMutation, "id" | "status" | "createdAt" | "updatedAt" | "retryCount">): Promise<number> {
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

export async function markFailed(id: number, error: string): Promise<void> {
  const db = await getDb()
  const item = await db.get("mutations", id)
  if (!item) return
  await db.put("mutations", {
    ...item,
    status: "failed",
    updatedAt: Date.now(),
    retryCount: item.retryCount + 1,
    lastError: error,
  })
}

export async function retryFailed(): Promise<void> {
  const db = await getDb()
  const failed = await db.getAllFromIndex("mutations", "by-status", "failed")
  const tx = db.transaction("mutations", "readwrite")
  await Promise.all(
    failed.map((m) => tx.store.put({ ...m, status: "pending", updatedAt: Date.now() }))
  )
  await tx.done
}

export async function clearSynced(): Promise<void> {
  // Keep the store clean — só remove synced (já deletados acima por markSynced)
  // e elimina falhas com retryCount muito alto (>= 10) como "poison message".
  const db = await getDb()
  const all = await db.getAll("mutations")
  const tx = db.transaction("mutations", "readwrite")
  for (const m of all) {
    if (m.retryCount >= 10) {
      await tx.store.delete(m.id!)
    }
  }
  await tx.done
}

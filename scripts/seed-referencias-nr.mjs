#!/usr/bin/env node
/**
 * Seed do catálogo de NRs a partir de data/nr-catalog.json.
 * Idempotente — upsert por `numero`. Pode rodar quantas vezes quiser.
 *
 * Pré-requisitos:
 *   - Migration 0011 aplicada (tabela nr_catalog existindo)
 *   - data/nr-catalog.json gerado (extração via gov.br)
 *   - .env.local com NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso: node scripts/seed-referencias-nr.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DATA_FILE = join(__dirname, "..", "data", "nr-catalog.json")
const raw = JSON.parse(readFileSync(DATA_FILE, "utf8"))
if (!Array.isArray(raw)) {
  console.error(`ERRO: ${DATA_FILE} não é um array JSON`)
  process.exit(1)
}

// Whitelist de colunas: agente pode incluir campos extras; aqui filtramos pra
// bater 1:1 com o schema de nr_catalog e evitar erros do PostgREST.
const COLS = [
  "numero",
  "titulo",
  "status",
  "data_atualizacao",
  "fonte_url",
  "fonte_status",
  "pdf_url",
  "ementa",
  "campo_aplicacao",
  "portarias_recentes",
  "manuais_relacionados",
  "notas",
]

const rows = raw.map((r) => {
  const out = {}
  for (const c of COLS) if (r[c] !== undefined && r[c] !== null) out[c] = r[c]
  if (!out.portarias_recentes) out.portarias_recentes = []
  if (!out.manuais_relacionados) out.manuais_relacionados = []
  return out
})

console.log(`Upserting ${rows.length} NRs em nr_catalog...`)

const { data: result, error } = await supabase
  .from("nr_catalog")
  .upsert(rows, { onConflict: "numero" })
  .select("numero, status, fonte_status")

if (error) {
  console.error("Erro no upsert:", error)
  process.exit(1)
}

const vigentes = result.filter((r) => r.status === "vigente").length
const revogadas = result.filter((r) => r.status === "revogada").length
const partial = result.filter((r) => r.fonte_status === "partial").length

console.log(`✔ ${result.length} NRs gravadas`)
console.log(`  vigentes:  ${vigentes}`)
console.log(`  revogadas: ${revogadas}`)
if (partial > 0) {
  console.log(`  ⚠ ${partial} NRs com fonte_status='partial' — revisar manualmente`)
}

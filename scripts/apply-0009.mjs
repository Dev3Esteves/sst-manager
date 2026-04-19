#!/usr/bin/env node
/**
 * Script único para aplicar SÓ a migration 0009. Útil quando as anteriores
 * já foram aplicadas e só queremos rodar a nova.
 *
 * Uso:
 *   SB_TOKEN=sbp_xxx PROJECT_REF=bxqoppzupqewdwvudcfg node scripts/apply-0009.mjs
 *
 * PROJECT_REF default: bxqoppzupqewdwvudcfg (SISTENGE).
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const SB_TOKEN = process.env.SB_TOKEN
const PROJECT_REF = process.env.PROJECT_REF || "bxqoppzupqewdwvudcfg"

if (!SB_TOKEN) {
  console.error("SB_TOKEN não definido. Exporte seu Personal Access Token do Supabase Dashboard.")
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const file = "0009_empresa_hierarquia_e_obras.sql"
const sql = readFileSync(join(__dirname, "..", "supabase", "migrations", file), "utf8")

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
)

const text = await res.text()
if (!res.ok) {
  console.error(`FAIL ${res.status}:`, text.slice(0, 2000))
  process.exit(1)
}
console.log(`✓ Migration 0009 aplicada com sucesso (${res.status})`)
if (text && text.length < 500) console.log(`  ${text}`)

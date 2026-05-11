#!/usr/bin/env node
/**
 * Seed do catálogo Tabela 24 do eSocial (agentes nocivos) a partir de
 * data/esocial-tabela24.json. Idempotente — upsert por `codigo`.
 *
 * Pré-requisitos:
 *   - Migration 0013 aplicada (tabela esocial_agente_nocivo existindo)
 *   - data/esocial-tabela24.json gerado (extração de gov.br/esocial)
 *   - .env.local com NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso: node scripts/seed-esocial-tabela24.mjs
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

const DATA_FILE = join(__dirname, "..", "data", "esocial-tabela24.json")
const raw = JSON.parse(readFileSync(DATA_FILE, "utf8"))
if (!Array.isArray(raw)) {
  console.error(`ERRO: ${DATA_FILE} não é um array JSON`)
  process.exit(1)
}

// Whitelist de colunas para evitar erros do PostgREST com campos extras
const COLS = [
  "codigo",
  "descricao",
  "grupo",
  "exige_aposentadoria_especial",
  "limite_tolerancia",
  "observacao",
  "fonte_url",
  "versao_leiaute",
  "ativo",
]

const GRUPOS_VALIDOS = new Set(["quimico", "fisico", "biologico", "associacao", "ausencia"])

const erros = []
const rows = raw.map((r, i) => {
  const out = {}
  for (const c of COLS) if (r[c] !== undefined && r[c] !== null) out[c] = r[c]
  if (!out.codigo) erros.push(`[${i}] sem codigo`)
  if (!out.descricao) erros.push(`[${i}] sem descricao`)
  if (!GRUPOS_VALIDOS.has(out.grupo))
    erros.push(`[${i}] grupo inválido: ${out.grupo} (esperado: ${[...GRUPOS_VALIDOS].join(", ")})`)
  if (!/^\d{2}\.\d{2}\.\d{3}$/.test(out.codigo))
    erros.push(`[${i}] codigo fora do padrão XX.XX.XXX: ${out.codigo}`)
  return out
})

if (erros.length > 0) {
  console.error("Erros de validação no JSON de entrada:")
  for (const e of erros) console.error("  -", e)
  process.exit(1)
}

console.log(`Upserting ${rows.length} agentes nocivos em esocial_agente_nocivo...`)

const { data: result, error } = await supabase
  .from("esocial_agente_nocivo")
  .upsert(rows, { onConflict: "codigo" })
  .select("codigo, grupo, exige_aposentadoria_especial, ativo")

if (error) {
  console.error("Erro no upsert:", error)
  process.exit(1)
}

const porGrupo = result.reduce((acc, r) => {
  acc[r.grupo] = (acc[r.grupo] ?? 0) + 1
  return acc
}, {})
const ativos = result.filter((r) => r.ativo).length
const apoEsp = result.filter((r) => r.exige_aposentadoria_especial).length

console.log(`✓ ${result.length} agentes upsertados.`)
console.log(`  Por grupo:`, porGrupo)
console.log(`  Ativos: ${ativos} · Aposentadoria especial: ${apoEsp}`)

#!/usr/bin/env node
// Aplica as migrations SQL em ordem, de forma IDEMPOTENTE.
//
// Mantém uma tabela de controle `_sst_migrations` com o que já foi aplicado.
// - Migration nova → aplica e registra.
// - Migration já registrada → pula.
// - Migration cujo objeto JÁ EXISTE no banco (ex.: schema legado aplicado à
//   mão, antes deste controle) → registra como "baseline" sem reexecutar
//   (detecta o erro "already exists"). Isso torna seguro rodar em bancos que
//   já tinham o schema antes do rastreamento.
//
// Uso:  SB_TOKEN=sbp_xxx [PROJECT_REF=...] node scripts/apply-migrations.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SB_TOKEN = process.env.SB_TOKEN
const PROJECT_REF = process.env.PROJECT_REF || 'bxqoppzupqewdwvudcfg'

if (!SB_TOKEN) {
  console.error('SB_TOKEN not set')
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
const ALREADY_EXISTS = /already exists|already a member|duplicate (key|object)/i

async function runSql(query) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

// 1. Tabela de controle (idempotente)
const ctl = await runSql(
  `CREATE TABLE IF NOT EXISTS _sst_migrations (
     nome text PRIMARY KEY,
     aplicada_em timestamptz NOT NULL DEFAULT now()
   );`,
)
if (!ctl.ok) {
  console.error('Falha ao criar _sst_migrations:', ctl.text.slice(0, 500))
  process.exit(1)
}

// 2. O que já foi registrado
const aplicadasRes = await runSql('SELECT nome FROM _sst_migrations;')
if (!aplicadasRes.ok) {
  console.error('Falha ao ler _sst_migrations:', aplicadasRes.text.slice(0, 500))
  process.exit(1)
}
const aplicadas = new Set()
try {
  const rows = JSON.parse(aplicadasRes.text)
  if (Array.isArray(rows)) for (const r of rows) aplicadas.add(r.nome)
} catch {
  /* resposta sem linhas — set vazio */
}

async function registrar(file) {
  const nomeEscapado = file.replace(/'/g, "''")
  await runSql(`INSERT INTO _sst_migrations (nome) VALUES ('${nomeEscapado}') ON CONFLICT (nome) DO NOTHING;`)
}

let aplicou = 0
let baseline = 0
let puladas = 0

for (const f of files) {
  if (aplicadas.has(f)) {
    console.log(`[${f}] já registrada — pulando`)
    puladas++
    continue
  }
  const sql = readFileSync(join(migrationsDir, f), 'utf8')
  const r = await runSql(sql)
  if (r.ok) {
    await registrar(f)
    console.log(`[${f}] aplicada ✓`)
    aplicou++
  } else if (ALREADY_EXISTS.test(r.text)) {
    // Schema já existia antes do controle — registra sem reexecutar.
    await registrar(f)
    console.log(`[${f}] objeto já existia no banco — registrada (baseline)`)
    baseline++
  } else {
    console.error(`[${f}] FAIL ${r.status}: ${r.text.slice(0, 1000)}`)
    process.exit(1)
  }
}

console.log(
  `\nConcluído: ${aplicou} aplicada(s), ${baseline} baseline (já existiam), ${puladas} já registrada(s).`,
)

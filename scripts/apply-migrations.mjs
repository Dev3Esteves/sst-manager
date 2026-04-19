#!/usr/bin/env node
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
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

async function apply(file) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`[${file}] FAIL ${res.status}:`, text.slice(0, 1000))
    return false
  }
  console.log(`[${file}] OK (${res.status}) → ${text.slice(0, 200)}`)
  return true
}

for (const f of files) {
  const ok = await apply(f)
  if (!ok) process.exit(1)
}
console.log('\nAll migrations applied successfully.')

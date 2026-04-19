#!/usr/bin/env node
// Testa login programático — isola se o problema é senha ou cookie do browser.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const EMAIL = process.argv[2]
const SENHA = process.argv[3]

if (!EMAIL || !SENHA) {
  console.log('Uso: node test-login.mjs EMAIL SENHA')
  process.exit(1)
}

// Use anon key — mesmo caminho que a UI
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

console.log(`→ Tentando signInWithPassword para ${EMAIL}...`)
const { data, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: SENHA })

if (error) {
  console.error(`✗ FALHA: ${error.message}`)
  console.error(`   code: ${error.code ?? '(sem code)'}`)
  console.error(`   status: ${error.status ?? '(sem status)'}`)
  process.exit(1)
}

console.log(`✓ LOGIN OK!`)
console.log(`   user_id: ${data.user.id}`)
console.log(`   token prefix: ${data.session.access_token.slice(0, 20)}...`)
console.log(`\n→ A senha está correta. Problema é no browser (cookie antigo).`)
console.log(`  Solução: abra http://localhost:3000/login em ABA ANÔNIMA (Ctrl+Shift+N)`)

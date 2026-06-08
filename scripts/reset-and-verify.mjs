#!/usr/bin/env node
// Reseta a senha E valida via signInWithPassword — garante que funcionou.

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

const EMAIL = process.argv[2] || `admin@${env.NEXT_PUBLIC_BRAND_EMAIL_DOMAIN || 'exemplo.com.br'}`
const SENHA = process.argv[3] || 'Admin@2026'

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

console.log(`→ Passo 1: localizando ${EMAIL}...`)
const { data: list, error: listErr } = await admin.auth.admin.listUsers()
if (listErr) { console.error(listErr); process.exit(1) }
const user = list.users.find(u => u.email === EMAIL)
if (!user) { console.error(`Usuário não encontrado`); process.exit(1) }
console.log(`  ✓ user_id: ${user.id}`)

console.log(`\n→ Passo 2: resetando senha para "${SENHA}"...`)
const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password: SENHA })
if (updErr) { console.error(updErr); process.exit(1) }
console.log(`  ✓ updateUserById retornou OK`)

console.log(`\n→ Passo 3: aguardando 1s para propagação...`)
await new Promise(r => setTimeout(r, 1000))

console.log(`\n→ Passo 4: testando signInWithPassword...`)
const { data, error: signErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: SENHA })
if (signErr) {
  console.error(`\n  ✗ AINDA FALHA: ${signErr.message}`)
  console.error(`\n  Isso é inesperado. Possíveis causas:`)
  console.error(`    - Replicação do Supabase atrasada (tente de novo em 30s)`)
  console.error(`    - Email tem confirmação pendente`)
  console.error(`    - Usuário banned`)
  console.error(`\n  Detalhes do user:`)
  const { data: refreshed } = await admin.auth.admin.getUserById(user.id)
  console.error(`    email_confirmed_at: ${refreshed.user?.email_confirmed_at}`)
  console.error(`    banned_until: ${refreshed.user?.banned_until ?? '(nenhum)'}`)
  process.exit(1)
}

console.log(`  ✓ LOGIN CONFIRMADO!`)
console.log(`\n=============================================`)
console.log(`  CREDENCIAIS TESTADAS E FUNCIONAIS`)
console.log(`=============================================`)
console.log(`  URL:    http://localhost:3000/login`)
console.log(`  Email:  ${EMAIL}`)
console.log(`  Senha:  ${SENHA}`)
console.log(`=============================================`)
console.log(`\nIMPORTANTE: se o browser ainda não logar,`)
console.log(`abra em JANELA ANÔNIMA (Ctrl+Shift+N no Chrome)`)
console.log(`para limpar cookies antigos.\n`)

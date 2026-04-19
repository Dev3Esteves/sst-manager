#!/usr/bin/env node
// Reseta a senha do usuário admin. One-off. Mostra a nova senha uma única vez.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const EMAIL = process.argv[2] || 'admin@sistenge.com.br'
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log(`→ Buscando usuário ${EMAIL}...`)
const { data: list, error: listErr } = await supabase.auth.admin.listUsers()
if (listErr) { console.error('Erro:', listErr); process.exit(1) }

const user = list.users.find(u => u.email === EMAIL)
if (!user) {
  console.error(`✗ Usuário ${EMAIL} não encontrado`)
  process.exit(1)
}

// Senha só com alfanuméricos — evita problemas ao digitar caracteres especiais
const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const novaSenha = Array.from(randomBytes(14))
  .map((b) => alfabeto[b % alfabeto.length])
  .join('')

const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, { password: novaSenha })
if (updErr) { console.error('Erro ao resetar:', updErr); process.exit(1) }

console.log(`\n=============================================`)
console.log(`  SENHA RESETADA — ANOTE AGORA`)
console.log(`=============================================`)
console.log(`  Email:  ${EMAIL}`)
console.log(`  Senha:  ${novaSenha}`)
console.log(`  User ID: ${user.id}`)
console.log(`=============================================\n`)

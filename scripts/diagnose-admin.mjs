#!/usr/bin/env node
// Diagnóstico completo dos usuários admin.

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log('=== AUTH USERS ===')
const { data: authData } = await supabase.auth.admin.listUsers()
for (const u of authData.users) {
  console.log(`  ${u.email}`)
  console.log(`    id:            ${u.id}`)
  console.log(`    created_at:    ${u.created_at}`)
  console.log(`    email_confirmed_at: ${u.email_confirmed_at}`)
  console.log(`    last_sign_in:  ${u.last_sign_in_at}`)
  console.log(`    banned_until:  ${u.banned_until ?? '(nenhum)'}`)
  console.log(`    updated_at:    ${u.updated_at}`)
}

console.log('\n=== PUBLIC.USUARIOS ===')
const { data: usuariosRows } = await supabase
  .from('usuarios')
  .select('id, ativo, perfis_acesso(nome), empresas(razao_social)')
for (const u of usuariosRows) {
  const p = Array.isArray(u.perfis_acesso) ? u.perfis_acesso[0] : u.perfis_acesso
  const e = Array.isArray(u.empresas) ? u.empresas[0] : u.empresas
  console.log(`  ${u.id.slice(0,8)}... ativo=${u.ativo} perfil=${p?.nome} empresa=${e?.razao_social}`)
}

console.log('\n=== PERFIS DISPONÍVEIS ===')
const { data: perfis } = await supabase.from('perfis_acesso').select('id, nome')
for (const p of perfis) {
  console.log(`  ${p.nome} — ${p.id}`)
}

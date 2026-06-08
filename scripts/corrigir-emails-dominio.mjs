#!/usr/bin/env node
// Corrige e-mails de um domínio antigo para um novo (informados por argumento).
// Atualiza tanto o login (Supabase Auth) quanto a coluna colaboradores.email.
//
// Dry-run por padrão (apenas lista). Passe --apply para efetivar.
//
// Uso:
//   node scripts/corrigir-emails-dominio.mjs @antigo.com @novo.com           # lista
//   node scripts/corrigir-emails-dominio.mjs @antigo.com @novo.com --apply   # aplica

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const APPLY = process.argv.includes('--apply')
const domainArgs = process.argv.slice(2).filter((a) => a !== '--apply')
const OLD = domainArgs[0]
const NEW = domainArgs[1]
if (!OLD || !NEW) {
  console.error('Informe o domínio antigo e o novo. Ex.: node scripts/corrigir-emails-dominio.mjs @antigo.com @novo.com')
  process.exit(1)
}
const fix = (email) => email.slice(0, email.length - OLD.length) + NEW

console.log(APPLY ? '== MODO APLICAR ==' : '== DRY-RUN (use --apply para efetivar) ==')
console.log(`Projeto: ${SUPABASE_URL}\n`)

// 1. Usuários do Supabase Auth (e-mail de login)
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listErr) { console.error('Erro listUsers:', listErr.message); process.exit(1) }

const authAlvo = list.users.filter(u => u.email && u.email.toLowerCase().endsWith(OLD))
console.log(`Auth users com ${OLD}: ${authAlvo.length}`)
let authOk = 0, authFail = 0
for (const u of authAlvo) {
  const novo = fix(u.email)
  console.log(`  ${u.email}  ->  ${novo}`)
  if (APPLY) {
    const { error } = await supabase.auth.admin.updateUserById(u.id, { email: novo, email_confirm: true })
    if (error) { console.error(`    ✗ ${error.message}`); authFail++ } else { authOk++ }
  }
}

// 2. Coluna colaboradores.email
const { data: colabs, error: colabErr } = await supabase
  .from('colaboradores')
  .select('id, nome_completo, email')
  .ilike('email', `%${OLD}`)
if (colabErr) { console.error('Erro colaboradores:', colabErr.message); process.exit(1) }

console.log(`\nColaboradores com ${OLD}: ${colabs.length}`)
let colabOk = 0, colabFail = 0
for (const c of colabs) {
  const novo = fix(c.email)
  console.log(`  ${c.nome_completo}: ${c.email}  ->  ${novo}`)
  if (APPLY) {
    const { error } = await supabase.from('colaboradores').update({ email: novo }).eq('id', c.id)
    if (error) { console.error(`    ✗ ${error.message}`); colabFail++ } else { colabOk++ }
  }
}

console.log('\n== Resumo ==')
if (APPLY) {
  console.log(`Auth:          ${authOk} atualizados, ${authFail} erro(s)`)
  console.log(`Colaboradores: ${colabOk} atualizados, ${colabFail} erro(s)`)
  if (authFail || colabFail) process.exit(1)
} else {
  console.log(`Seriam alterados: ${authAlvo.length} login(s) + ${colabs.length} colaborador(es)`)
  console.log('Revise a lista acima e rode novamente com --apply para efetivar.')
}

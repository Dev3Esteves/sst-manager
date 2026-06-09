#!/usr/bin/env node
// Cria empresa Empresa Demo + usuário admin + vínculo na tabela usuarios.
// Roda uma vez. Idempotente: se já existir, não duplica.

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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_EMAIL = process.argv[2] || 'admin@exemplo.com.br'
const ADMIN_PASSWORD = process.argv[3] || randomBytes(12).toString('base64url')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log(`→ Usando email: ${ADMIN_EMAIL}`)

// 1. Empresa Empresa Demo (upsert por CNPJ)
const { data: empresaExist } = await supabase
  .from('empresas')
  .select('id')
  .eq('cnpj', '00.000.000/0001-00')
  .maybeSingle()

let empresaId
if (empresaExist) {
  empresaId = empresaExist.id
  console.log(`✓ Empresa Empresa Demo já existe (${empresaId})`)
} else {
  const { data, error } = await supabase
    .from('empresas')
    .insert({
      razao_social: 'Empresa Demo',
      nome_fantasia: 'Empresa Demo',
      cnpj: '00.000.000/0001-00',
      tipo: 'propria',
      ativo: true,
    })
    .select('id')
    .single()
  if (error) { console.error('Erro empresa:', error); process.exit(1) }
  empresaId = data.id
  console.log(`✓ Empresa Empresa Demo criada (${empresaId})`)
  console.log(`  ⚠ CNPJ placeholder — atualize no app depois`)
}

// 2. Perfil admin
const { data: perfilAdmin } = await supabase
  .from('perfis_acesso')
  .select('id')
  .eq('nome', 'admin')
  .single()
const perfilId = perfilAdmin.id

// 3. Usuário auth
const { data: existing } = await supabase.auth.admin.listUsers()
let authUser = existing.users.find(u => u.email === ADMIN_EMAIL)

if (authUser) {
  console.log(`✓ Auth user já existe (${authUser.id})`)
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { perfil: 'admin' },
  })
  if (error) { console.error('Erro auth:', error); process.exit(1) }
  authUser = data.user
  console.log(`✓ Auth user criado (${authUser.id})`)
  console.log(`\n=================================================`)
  console.log(`  CREDENCIAIS ADMIN — ANOTE AGORA`)
  console.log(`=================================================`)
  console.log(`  Email:  ${ADMIN_EMAIL}`)
  console.log(`  Senha:  ${ADMIN_PASSWORD}`)
  console.log(`=================================================\n`)
}

// 4. Link em usuarios
const { data: linkExist } = await supabase
  .from('usuarios')
  .select('id')
  .eq('id', authUser.id)
  .maybeSingle()

if (linkExist) {
  console.log(`✓ Vínculo usuarios já existe`)
} else {
  const { error } = await supabase.from('usuarios').insert({
    id: authUser.id,
    perfil_id: perfilId,
    empresa_id: empresaId,
    ativo: true,
  })
  if (error) { console.error('Erro usuarios:', error); process.exit(1) }
  console.log(`✓ Vínculo criado em usuarios (admin → Empresa Demo)`)
}

console.log('\n✓ Bootstrap completo. Use o login em http://localhost:3000/login')

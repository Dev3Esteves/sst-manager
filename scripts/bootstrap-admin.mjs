#!/usr/bin/env node
// Onboarding inicial de uma instância:
//   1) Organização (singleton conta/marca)
//   2) 1ª empresa própria
//   3) usuário admin (auth + tabela usuarios)
//   4) vínculo usuario_empresas + empresa ativa
// Roda uma vez. Idempotente: se já existir, não duplica.
//
// Uso: node scripts/bootstrap-admin.mjs [email] [senha] [nomeMarca]

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
const MARCA_NOME = process.argv[4] || 'Minha Organização'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log(`→ Usando email: ${ADMIN_EMAIL}`)

// 1. Organização (singleton). Cria só se ainda não houver.
const { data: orgExist } = await supabase
  .from('organizacao')
  .select('id')
  .limit(1)
  .maybeSingle()

if (orgExist) {
  console.log(`✓ Organização já existe (${orgExist.id})`)
} else {
  const { data, error } = await supabase
    .from('organizacao')
    .insert({
      singleton: true,
      nome: MARCA_NOME,
      logo_url: null,
      template_certificado: null,
    })
    .select('id')
    .single()
  if (error) { console.error('Erro organizacao:', error); process.exit(1) }
  console.log(`✓ Organização criada (${data.id}) — marca: ${MARCA_NOME}`)
}

// 2. 1ª empresa própria (upsert por CNPJ placeholder).
const { data: empresaExist } = await supabase
  .from('empresas')
  .select('id')
  .eq('cnpj', '00.000.000/0001-00')
  .maybeSingle()

let empresaId
if (empresaExist) {
  empresaId = empresaExist.id
  console.log(`✓ Empresa própria já existe (${empresaId})`)
} else {
  const { data, error } = await supabase
    .from('empresas')
    .insert({
      razao_social: 'Empresa própria',
      nome_fantasia: 'Empresa própria',
      cnpj: '00.000.000/0001-00',
      propria: true,
      ativo: true,
    })
    .select('id')
    .single()
  if (error) { console.error('Erro empresa:', error); process.exit(1) }
  empresaId = data.id
  console.log(`✓ Empresa própria criada (${empresaId})`)
  console.log(`  ⚠ CNPJ placeholder — atualize no app depois`)
}

// 2b. Papel 'propria' em empresa_papeis.
const { error: papelErr } = await supabase
  .from('empresa_papeis')
  .upsert(
    { empresa_id: empresaId, papel: 'propria' },
    { onConflict: 'empresa_id,papel', ignoreDuplicates: true },
  )
if (papelErr) { console.error('Erro empresa_papeis:', papelErr); process.exit(1) }
console.log(`✓ Papel 'propria' garantido para a empresa própria`)

// 3. Perfil admin
const { data: perfilAdmin } = await supabase
  .from('perfis_acesso')
  .select('id')
  .eq('nome', 'admin')
  .single()
const perfilId = perfilAdmin.id

// 3b. Usuário auth
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

// 3c. Vínculo em usuarios (perfil + empresa principal + ativa)
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
    empresa_ativa_id: empresaId,
    ativo: true,
  })
  if (error) { console.error('Erro usuarios:', error); process.exit(1) }
  console.log(`✓ Vínculo criado em usuarios (admin → Empresa própria)`)
}

// 4. Vínculo em usuario_empresas (só aceita empresas próprias — trigger no banco)
const { error: ueErr } = await supabase
  .from('usuario_empresas')
  .upsert(
    { usuario_id: authUser.id, empresa_id: empresaId },
    { onConflict: 'usuario_id,empresa_id', ignoreDuplicates: true },
  )
if (ueErr) { console.error('Erro usuario_empresas:', ueErr); process.exit(1) }
console.log(`✓ Vínculo garantido em usuario_empresas`)

// 4b. Garante empresa_ativa_id apontando para a empresa própria (caso já existisse o usuário)
const { error: ativaErr } = await supabase
  .from('usuarios')
  .update({ empresa_ativa_id: empresaId })
  .eq('id', authUser.id)
  .is('empresa_ativa_id', null)
if (ativaErr) { console.error('Erro empresa_ativa_id:', ativaErr); process.exit(1) }

console.log('\n✓ Bootstrap completo. Use o login em http://localhost:3000/login')

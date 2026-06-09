#!/usr/bin/env node
/**
 * Aplica os templates de e-mail de autenticação (SST Manager) no projeto Supabase
 * de PRODUÇÃO via Management API. O `supabase/config.toml` só vale para o ambiente
 * local — produção precisa ser configurada por aqui (ou colando no Dashboard).
 *
 * Uso (PowerShell):
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_xxx"; node scripts/aplicar-email-templates.mjs
 * Uso (bash):
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/aplicar-email-templates.mjs
 *
 * O token é um Personal Access Token gerado em:
 *   https://supabase.com/dashboard/account/tokens
 * O project ref vem de SUPABASE_PROJECT_REF (.env.local) ou da env de mesmo nome.
 *
 * É idempotente: rode quantas vezes quiser; sempre seta o estado atual dos arquivos.
 */
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const raiz = join(__dirname, "..")

// Carrega SUPABASE_PROJECT_REF do .env.local se não estiver no ambiente.
function lerEnvLocal(chave) {
  if (process.env[chave]) return process.env[chave]
  const envPath = join(raiz, ".env.local")
  if (!existsSync(envPath)) return undefined
  const linha = readFileSync(envPath, "utf8").split(/\r?\n/).find((l) => l.startsWith(chave + "="))
  if (!linha) return undefined
  return linha.slice(chave.length + 1).trim().replace(/^["']|["']$/g, "")
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const REF = lerEnvLocal("SUPABASE_PROJECT_REF")

if (!TOKEN) {
  console.error("✗ Falta SUPABASE_ACCESS_TOKEN (Personal Access Token sbp_…).")
  console.error("  Gere em https://supabase.com/dashboard/account/tokens e rode de novo.")
  process.exit(1)
}
if (!REF) {
  console.error("✗ Falta SUPABASE_PROJECT_REF (ambiente ou .env.local).")
  process.exit(1)
}

// Mapeia cada template para os campos da Management API + assunto (igual ao config.toml).
const TEMPLATES = [
  { arquivo: "invite.html",       subjectField: "mailer_subjects_invite",       contentField: "mailer_templates_invite_content",       subject: "Você foi convidado para o SST Manager" },
  { arquivo: "confirmation.html", subjectField: "mailer_subjects_confirmation", contentField: "mailer_templates_confirmation_content", subject: "Confirme seu e-mail — SST Manager" },
  { arquivo: "recovery.html",     subjectField: "mailer_subjects_recovery",     contentField: "mailer_templates_recovery_content",     subject: "Redefinição de senha — SST Manager" },
  { arquivo: "email_change.html", subjectField: "mailer_subjects_email_change", contentField: "mailer_templates_email_change_content", subject: "Confirme a alteração de e-mail — SST Manager" },
]

const body = {}
for (const t of TEMPLATES) {
  const caminho = join(raiz, "supabase", "templates", t.arquivo)
  if (!existsSync(caminho)) {
    console.error(`✗ Template não encontrado: ${caminho}`)
    process.exit(1)
  }
  body[t.subjectField] = t.subject
  body[t.contentField] = readFileSync(caminho, "utf8")
}

const url = `https://api.supabase.com/v1/projects/${REF}/config/auth`
console.log(`→ Aplicando ${TEMPLATES.length} templates no projeto ${REF}...`)

const resp = await fetch(url, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

if (!resp.ok) {
  const txt = await resp.text().catch(() => "")
  console.error(`✗ Falhou (${resp.status}): ${txt.slice(0, 500)}`)
  process.exit(1)
}

console.log("✓ Templates aplicados em produção:")
for (const t of TEMPLATES) console.log(`   • ${t.arquivo}  —  "${t.subject}"`)
console.log("  Teste com 'Esqueci minha senha' e a criação de um usuário.")

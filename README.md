# SST Manager

[![CI](https://github.com/EvandroEstevesFerreira/sst-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/EvandroEstevesFerreira/sst-manager/actions/workflows/ci.yml)

Sistema de Gestão de Segurança e Saúde do Trabalho para engenharias e data
centers. Next.js 14 + Supabase + shadcn/ui.

---

## Rodando localmente

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. `.env.local` precisa ter:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (apenas server-side)
- `CRON_SECRET` (string aleatória — usada pelos workers `/api/cron/*`; em produção, configure igual ao secret que o Vercel Cron injeta automaticamente)

Opcionais:
- `RESEND_API_KEY` + `EMAIL_FROM` (notificações de vencimento por e-mail via Resend; sem a chave, o cron roda mas não envia)
- `NEXT_PUBLIC_APP_URL` (URL pública usada em links de e-mail)
- `ANTHROPIC_API_KEY` (classificação de risco em APR via IA)

Use o `.env.example` como base.

---

## Validação

```bash
npm test              # 180+ testes unitários (Vitest)
npx tsc --noEmit      # type-check (zero erros)
npm run build         # build de produção (todas 58 rotas)
```

---

## Banco de dados (Supabase)

### Aplicar migrations

Para aplicar todas as migrations em ordem (idempotente):

```bash
SB_TOKEN=sbp_xxx PROJECT_REF=bxqoppzupqewdwvudcfg \
  node scripts/apply-migrations.mjs
```

Para aplicar só a migration mais recente (0009 — hierarquia + obras):

```bash
SB_TOKEN=sbp_xxx node scripts/apply-0009.mjs
```

O `SB_TOKEN` é seu Personal Access Token do Supabase Dashboard
(https://supabase.com/dashboard/account/tokens).

### Popular dados de demonstração

```bash
node scripts/seed-demo-complete.mjs   # cadastros completos (colaboradores, treinamentos, exames, etc.)
node scripts/seed-obras-epis.mjs      # incremental: obras + EPIs por cargo
```

### Resetar senha admin

```bash
node scripts/reset-admin-password.mjs
```

---

## Estrutura de empresas (multi-tenant)

O sistema é multi-tenant por empresa. Três classificações (via `empresas.tipo`):

| Tipo | Uso |
|---|---|
| `propria` + `dona_sistema=true` | Empresa-dona. Hospeda seus próprios colaboradores/documentos. |
| `contratante` | Cliente onde a dona executa obras. |
| `terceira` | Prestadora — pode ser vinculada a uma dona via `empresa_mae_id`. |

RLS isola por `empresa_id`; admin vê todas (via helper `user_perfil_nome()`).

Reforço visual: componente `EmpresaBadge` mostra cor estável (hash djb2 do UUID)
ao lado de cada registro em listas cross-empresa.

---

## Fluxos principais

### Emissão de Ordem de Serviço NR-01 por função
1. Acesse `/documentos/os-nr01/new`
2. Escolha empresa dona, função (cargo) e obra
3. Sistema pré-preenche riscos (`cargos.riscos_associados`) e EPIs obrigatórios/eventuais
   (`cargos.epis_obrigatorios`) do cargo
4. PDF gerado com 1 página por colaborador da função alocado na obra

### Emissão de Ficha de EPI cumulativa
1. Em `/colaboradores`, clique no ícone 🪖 ao lado do colaborador
2. Sistema emite PDF com TODAS as entregas históricas daquele colaborador
3. Cabeçalho com dados do cargo/obra atual + Termo de Responsabilidade NR-06

### Configuração de EPIs por função
1. Em `/cargos/[id]`, role até "EPIs associados à função"
2. Adicione EPIs obrigatórios (sempre) e eventuais (conforme atividade)
3. Observação por EPI (ex.: "Classe 3 para MT")

---

## Rotas principais

- `/dashboard` — KPIs + heatmap de ocorrências
- `/empresas` — 3 tabs: Donas / Contratantes / Prestadoras
- `/obras` — projetos em andamento
- `/colaboradores` — com badge de empresa + download de Ficha de EPI
- `/cargos` — com seletor de EPIs obrigatórios/eventuais
- `/documentos/new` — novo documento (APR, PT, Autorizações, **OS NR-01**)
- `/documentos/os-nr01/new` — emissão em lote por função + obra
- `/vencimentos` — exames, treinamentos e CAs a vencer
- `/relatorios/mensal` — relatório mensal com indicadores
- `/atalhos` — referência de atalhos de teclado (Ctrl+K, etc.)

---

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Storage + RLS)
- **PDF**: @react-pdf/renderer
- **OCR**: Tesseract.js (client-side, para ASOs)
- **Offline**: IndexedDB via idb
- **Tests**: Vitest (unit + PDF smoke)

---

## Troubleshooting

### "Static page generation timing out" no build
Páginas `importar/page.tsx` passam schemas Zod (classes) como props para client
components — não serializáveis para static export. Cada uma já tem
`export const dynamic = "force-dynamic"` que força render dinâmico.

### "ANTHROPIC_API_KEY não configurada"
A feature de classificação automática de risco via IA é opcional. Funciona só
com `ANTHROPIC_API_KEY` no `.env.local`. Sem a chave, o botão "Sugerir via IA"
em APR mostra erro amigável — o formulário continua editável manualmente.

# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não lançado]

_Mudanças em desenvolvimento na branch `master` ainda não publicadas numa tag._

---

## [0.6.0] — 2026-04-21

### Adicionado
- **Fila assíncrona de jobs** (`src/lib/jobs/`, migration `0010`)
  - Nova tabela `jobs` com FSM `queued → processing → completed|failed`, retry (max_attempts=3 por padrão), `claimed_by`/`claimed_at` pra rastrear worker, `progress_current`/`progress_total` pra progresso incremental
  - **Função SQL `claim_next_job(worker_id)`** com `SKIP LOCKED` — garante que N workers concorrentes pegam N jobs diferentes sem deadlock
  - Índices dedicados: `(created_at) WHERE status='queued'` pra pickup rápido, `(user_id, created_at DESC)` pra listagem
  - RLS por empresa (mesmo padrão das outras tabelas); insert exige `user_id = auth.uid()`
  - Bucket `job-results` privado (50MB, zip/pdf) + policy de leitura authenticated
- **`src/lib/jobs/queue.ts`** — helpers `enqueueJob`, `claimNextJob`, `updateProgress`, `markJobCompleted`, `markJobFailed`, `getJob`, `listJobs`, `makeWorkerId`
  - Política de retry em `markJobFailed`: se `attempts < max_attempts`, volta pra `queued` limpando `claimed_*`; senão finaliza como `failed`
  - Stack truncado a 10 linhas em `error_detail`; mensagem a 2000 chars na coluna `error_message`
  - Normaliza resposta da RPC (postgrest às vezes devolve array de 1)
  - **18 testes** cobrindo enqueue, claim (array vs objeto vs null), política de retry, truncamento, progresso, listagem
- **Worker `/api/cron/process-jobs`** protegido por `CRON_SECRET`
  - Claim atômico → dispatch → `markJobCompleted`/`markJobFailed`
  - Apenas 1 job por invocação (respeita timeout do Vercel; cron dispara cada minuto)
  - Tudo logado via logger estruturado (#8): `jobId, workerId, jobType, attempts, outcome, bytes, summary`
- **Endpoints REST**
  - `POST /api/jobs/documentos-lote` — enfileira e retorna `{ jobId }` em `202 Accepted`
  - `GET /api/jobs` — lista paginada (RLS filtra por empresa)
  - `GET /api/jobs/[id]` — status com `{ status, progress: {current, total, pct}, error_message, result_summary, ... }`
  - `GET /api/jobs/[id]/download` — gera signed URL de 1h e redireciona 302 pro Storage (evita proxy de bytes pela função serverless)
- **Processor `documentos_lote`** (`src/lib/jobs/processors/documentos-lote.ts`)
  - Reimplementa a geração de `autorizacao_nr` e `certificado` com callback `onProgress` incremental
  - Upload do ZIP pro bucket `job-results` no path `<jobId>/<filename>`
  - Retorna `JobResult` com storage_path, filename, content_type, bytes e summary (gerados/pulados/resultados)
- **Dispatcher** (`src/lib/jobs/dispatch.ts`) com exhaustiveness check TS
- **UI `/jobs`** (`src/app/(app)/jobs/`)
  - Server component faz SSR inicial (sem flicker) + client component `JobsListLive` com polling 3s
  - Polling auto-stop quando todos jobs chegam a `completed|failed`
  - Barra de progresso animada, badges por status, botão de download via `<a target="_blank">` (signed URL redirect)
  - Link "Fila de jobs" adicionado à sidebar (grupo Administração)
- **Botão "Enviar para fila"** em `/documentos/lote` — caminho assíncrono recomendado pra lotes grandes (>10 colaboradores), enfileira e redireciona pra `/jobs`. O botão síncrono continua como "Gerar ZIP agora" pra lotes pequenos
- **`vercel.json`** — cron registrado em `* * * * *` (minuto em minuto) para `/api/cron/process-jobs`

### Mudado
- `README.md` — documenta nova env var `CRON_SECRET` necessária para o worker
- `src/components/layout/sidebar.tsx` — novo item "Fila de jobs" com ícone `ListTodo` (após "Usuários", antes de "Auditoria")

### Corrigido
- _(nenhum fix — só feature nova)_

### Dependências
- _(nenhuma adicionada — Vercel Cron é configuração, JSZip e @react-pdf/renderer já existiam)_

---
## [0.5.0] — 2026-04-20

### Adicionado
- **Logger estruturado JSON** (`src/lib/logger.ts`)
  - Emite `{ level, ts, msg, route, requestId, userId, empresaId, ... }` em JSON para Vercel Logs
  - Formato `pretty` legível em dev (`NODE_ENV !== "production"`), JSON em prod — controlável via `LOG_FORMAT`
  - **Redação automática de PII** (cpf, cnpj, email, senha, token, authorization, cookie, access_token, refresh_token, secret) — recursiva até 6 níveis
  - `logger.child({ requestId, route })` cria escopo herdado por todas as chamadas daquele contexto
  - `logger.time("label")` retorna função `end()` que loga `durationMs` automaticamente — usado para timing de spans (build-data, render-pdf, etc)
  - `logger.exception(msg, err)` serializa Error com `name`, `message`, `stack` (truncado a 10 linhas) e `cause` recursivo
  - `newRequestId()` gera 8 chars hex via `crypto.getRandomValues` — portável, suficiente para correlação dentro de janelas razoáveis
  - **18 testes** cobrindo shape JSON, níveis, redação PII recursiva, propagação de contexto via `.child()`, timing, e propagação de `x-request-id`
- **Helper `withRouteLogging(route, req, handler)`** em `src/lib/logger.ts`
  - Gera/reaproveita `x-request-id` do request (valida hex 4-32 chars) e injeta no response
  - Mede duração total da handler, loga `start`/`done`/`threw`
  - Captura e re-lança exceções com log de `exception` já serializado
- **Captura global de erros no client**
  - `src/components/error-capture.tsx` — hook no `RootLayout` que escuta `window.error` e `unhandledrejection`, com dedup de 5s por `(message, stack[0:200])` pra não inundar o backend em loops
  - `src/lib/client-error-report.ts` — envia via `navigator.sendBeacon` (fallback `fetch` com keepalive) pra sobreviver a unload
  - `src/app/api/log/client/route.ts` — recebe report, limita payload a 32 KB, trunca stack a 4000 chars, e reemite via `logger.warn` (capturável no Vercel Logs)
  - `src/app/error.tsx` e novo `src/app/global-error.tsx` reportam ao endpoint automaticamente
- **Rotas críticas instrumentadas** (todas ganharam requestId, spans de tempo e logs de start/done/skip):
  - `POST /api/documentos/lote` — loga `tipo`, `count`, `gerados`, `pulados`, `zipBytes`
  - `POST /api/documentos/os-nr01/gerar` — spans `build-data` + `render-pdf`, loga `colaboradores` e `bytes` do PDF
  - `GET /api/colaboradores/[id]/ficha-epi/pdf` — span `render-ficha-epi`, loga `entregas` e `bytes`
  - `POST /api/sync/inspecoes` — loga `templateId`, `empresaId`, `percentual`, captura exception em insert

### Mudado
- `vitest.config.ts` — `testTimeout` elevado para 20s. Em Windows, o primeiro render por worker do `@react-pdf/renderer` (carregando fontes embutidas) em paralelo com outros testes às vezes estourava o default de 5s, causando flake no CI
- `src/app/layout.tsx` — monta `<ErrorCapture />` uma única vez dentro do `ThemeProvider` para instalar os listeners globais

### Corrigido
- _(nenhum fix nesta versão — só adição de observabilidade)_

---
## [0.4.0] — 2026-04-20

### Adicionado
- **Helpers de autorização centralizados** (`src/lib/auth/guards.ts`)
  - `requireAuth()`, `requireRole([...])`, `requireAdmin()` para Server Actions e route handlers (lançam `AuthError` com código `UNAUTHENTICATED` ou `FORBIDDEN`)
  - `getAuth()`, `getAuthWithRole()`, `checkRole()` para Server Components com UI de fallback
  - `authErrorToResponse()` converte `AuthError` em Response JSON 401/403 para reduzir boilerplate em rotas
  - Cada helper retorna `{ supabase, user, perfil }` numa chamada — evita recriar clients e duplicar `auth.getUser() + rpc user_perfil_nome`
  - **15 testes** cobrindo todos os branches (unauth/forbidden/ok, perfil desconhecido, mensagem customizada)
- **Padrão `Result<T>` unificado** (`src/lib/result.ts`)
  - Discriminated union `{ ok: true; data: T } | { ok: false; error: string; fieldErrors? }`
  - Helpers `ok()`, `err()`, `errFields()`, `isOk()`, `isErr()`
  - Mata classe inteira de bugs em que a UI tentava acessar `.data` num fluxo de erro — TypeScript narrowing força o check
- **Testes de integração** para 4 rotas críticas (+30 testes)
  - `/api/sync/inspecoes` — 11 testes (caso nominal, Zod, auth, DB error, percentual)
  - `/api/colaboradores/[id]/ficha-epi/pdf` — 5 testes (404, 200 application/pdf, fallback cargo/obra null, relação array)
  - `/api/search` — 7 testes (early return < 2 chars, 401, shape do retorno, agregação)
  - `/api/ia/classificar-risco` — 7 testes (200, 400 Zod, 401, 503 IAServiceUnavailable, 500 erro, body lixo)

### Mudado
- `usuarios/actions.ts` migrado para `Result<T>` — todas as 5 actions (criar/editar/reset/toggle/excluir)
- Páginas `/usuarios`, `/usuarios/new`, `/auditoria` refatoradas para usar `checkRole()` / `getAuth()`
- Rotas `/api/search`, `/api/sync/inspecoes`, `/api/ia/classificar-risco` usam `requireAuth()` + `authErrorToResponse()`

### Corrigido
- _(nenhum fix nesta versão — só reorganização arquitetural)_

---

## [0.3.1] — 2026-04-20

### Corrigido
- **`/api/documentos/[id]/pdf` retornava "Tipo não suportado: os_nr01"** ao tentar baixar PDF de OS NR-01 já persistida em `documentos_sst`
  - Extraído `buildOsNr01Data()` como helper compartilhado (`src/lib/pdf/os-nr01-builder.ts`)
  - Endpoint genérico ganhou branch `os_nr01` que reconstrói o PDF a partir de `cargo_id` + `obra_id` persistidos em `conteudo`/`obra_id`
  - Documentos emitidos antes da correção voltam a funcionar sem re-emissão

---

## [0.3.0] — 2026-04-19

### Adicionado
- **Senha criptograficamente segura** (`src/lib/validations/usuario.ts`)
  - Web Crypto `getRandomValues()` (portável server + client, não puxa `node:crypto` no bundle)
  - Rejection sampling para evitar viés modular
  - Fisher-Yates shuffle com CSPRNG (era `sort(Math.random - 0.5)`, enviesado)
  - +2 testes: distribuição uniforme em 1000 samples + posição dos mandatórios
- **Paginação server-side** em `/usuarios`
  - Componente reutilizável `<Pagination>` com preservação de search params
  - Helper `parsePageParam()` com 8 testes cobrindo edge cases
  - 25 itens/página, navegação `«‹ N/N ›»`
- **CI no GitHub Actions** (`.github/workflows/ci.yml`)
  - Matrix steps: `lint` → `tsc --noEmit` → `vitest` → `next build`
  - Concurrency cancel para evitar empilhar jobs
  - Envs dummy para o step de build
  - Badge no README
- **Fila offline com backoff exponencial** (`src/lib/offline/db.ts`, `sync.ts`)
  - Política `calcNextRetryDelay`: 60s → 120s → 240s → ... cap 1h, jitter ±20%
  - DB schema v2: `nextRetryAt` + status `poison` (após 10 tentativas)
  - `promoteReadyToRetry()` move `failed` com backoff expirado de volta a `pending`
  - `useBackgroundSync` — replay automático a cada 60s + no evento `online`
  - UI expansível no topbar com lista por mutação: ações "Tentar agora" / "Descartar"
  - Aviso distinto (vermelho) para `poison` + botão "Limpar falhas"
  - +16 testes: política de backoff + 8 cenários de rede

### Mudado
- `offline-status.tsx` migrado para popover expansível em vez de contador simples

---

## [0.2.0] — 2026-04-19

### Adicionado
- **Logos oficiais SISTENGE** (7 variantes SVG em `public/logos/`)
  - Horizontal claro/escuro, monocromático preto/branco, ícone principal e monocromáticos
  - Componente `<SistengeLogo>` com troca automática por tema (dark/light) via Tailwind — sem flash na hidratação
  - Aplicado em: tela de login (horizontal), sidebar (ícone), mobile nav drawer (ícone)

### Mudado
- Tela de login redesenhada com logo horizontal + rodapé de copyright
- `ShieldCheck` (lucide) substituído pelo ícone oficial no sidebar e mobile-nav

---

## [0.1.0] — 2026-04-18

### Adicionado — Sistema completo de gestão SST multi-tenant

**Modelagem de negócio:**
- Multi-tenant real (N empresas donas, cada uma isolada via RLS)
- 3 classificações de empresa: `propria` (dona) / `contratante` / `terceira` (prestadora)
- Hierarquia via `empresa_mae_id` — prestadoras vinculadas à dona
- Entidade **Obras** de primeira classe (projetos em andamento com empresa dona + contratante)
- Entidade **Cargos** com EPIs obrigatórios e eventuais JSONB

**Fluxos principais:**
- Cadastros: empresas, obras, cargos, colaboradores, EPIs, treinamentos
- Operação: exames médicos (PCMSO), DDS, ocorrências, inspeções
- Documentos SST: APR, PT, Autorizações NR-10/33/35, Ordem de Serviço NR-01 por função
- **Ficha de EPI cumulativa** (histórico vivo por colaborador, inspirada no SGI/FO-008-00 SISTENGE)
- Import CSV para 6 entidades

**UI/UX:**
- Paleta de comandos ⌘K (cmdk)
- Dark mode (next-themes)
- Mobile bottom nav (vaul drawer)
- Breadcrumbs dinâmicos
- Offline sync com IndexedDB
- `EmpresaBadge` colorido estável por hash djb2

**Infra:**
- Next.js 14 App Router + TypeScript
- Supabase Postgres + Auth + Storage + RLS + `pg_cron` (atualização diária de status de vencimentos)
- Audit log automático via SQL triggers (LGPD Art. 37)
- `@react-pdf/renderer` para todos os PDFs
- Tesseract.js OCR client-side para ASOs
- 9 migrations SQL versionadas

**Relatórios:**
- Dashboard com KPIs + Treemap de NRs
- Matriz de treinamentos (colaborador × NR)
- Relatório mensal com indicadores
- Heatmap de ocorrências
- Listagem de vencimentos com classificação de urgência

**Testes:**
- 181 testes em 17 suites (Vitest)
- PDF smoke tests (ficha de EPI, OS NR-01)

---

## Convenções

Este changelog é atualizado automaticamente pelos commits. Seguimos
[Conventional Commits](https://www.conventionalcommits.org/pt-br/):

| Tipo de commit | Impacto na versão |
|---|---|
| `feat:` | **minor** bump (nova funcionalidade) |
| `fix:` | **patch** bump (correção) |
| `BREAKING CHANGE:` no rodapé | **major** bump |
| `chore:`, `docs:`, `test:`, `refactor:`, `style:` | sem bump |

Para criar uma nova release:

```bash
npm run release:patch   # 0.4.0 → 0.4.1
npm run release:minor   # 0.4.0 → 0.5.0
npm run release:major   # 0.4.0 → 1.0.0
```

O script faz: bump no `package.json`, atualiza este `CHANGELOG.md`,
cria commit de release e cria tag git anotada. Depois é só `git push --tags`.

[Não lançado]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/EvandroEstevesFerreira/sst-manager/releases/tag/v0.1.0

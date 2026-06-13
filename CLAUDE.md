# CLAUDE.md

Diretrizes de comportamento para reduzir erros comuns de LLM ao codar neste repositório.
Combine com o contexto do projeto (memória, README, migrations). Para tarefas triviais, use bom senso.

> Princípios 1–4 adaptados de **andrej-karpathy-skills**
> (origem: `forrestchang/andrej-karpathy-skills`; espelho: `multica-ai/andrej-karpathy-skills`),
> derivados de observações do Andrej Karpathy sobre armadilhas de LLM em código.

## 1. Pense antes de codar

**Não assuma. Não esconda confusão. Exponha tradeoffs.**

- Declare suposições explicitamente. Se incerto, pergunte.
- Se há múltiplas interpretações, apresente-as — não escolha em silêncio.
- Se existe um caminho mais simples, diga. Discorde quando fizer sentido.
- Se algo está obscuro, pare, nomeie o que confunde e pergunte.

## 2. Simplicidade primeiro

**O mínimo de código que resolve o problema. Nada especulativo.**

- Sem features além do que foi pedido.
- Sem abstrações para código de uso único.
- Sem "flexibilidade"/"configurabilidade" não solicitada.
- Sem tratamento de erro para cenários impossíveis.
- Se escreveu 200 linhas e dava em 50, reescreva.

Pergunte-se: "um engenheiro sênior diria que isso está complicado demais?" Se sim, simplifique.

## 3. Mudanças cirúrgicas

**Toque só no necessário. Limpe só a sua própria bagunça.**

- Não "melhore" código/comentários/formatação adjacentes.
- Não refatore o que não está quebrado.
- Siga o estilo existente, mesmo que você faria diferente.
- Código morto pré-existente: mencione, não apague (a menos que peçam).
- Remova imports/variáveis/funções que **as suas** mudanças deixaram órfãos.

Teste: toda linha alterada deve rastrear direto ao pedido do usuário.

## 4. Execução orientada a meta

**Defina critério de sucesso. Itere até verificar.**

- "Adicionar validação" → "escrever testes p/ inputs inválidos e fazê-los passar".
- "Corrigir o bug" → "escrever um teste que reproduz e fazê-lo passar".
- "Refatorar X" → "garantir testes verdes antes e depois".
- Para tarefas multi-passo, declare um plano curto com a verificação de cada passo.

---

## Específico deste projeto

**Stack:** Next.js 14 (App Router) + TypeScript + Supabase (Postgres + RLS por `empresa_id`) +
shadcn/ui + Tailwind + Zod + Vitest. Design system: ver `DESIGN.md`.

**Verificação (rode antes de concluir):**
- Testes: `npx vitest run` (ou escopo: `npx vitest run <path>`).
- Lint: `npx next lint` (o repo comercial **exige** lint limpo antes do merge).
- Tipos: `npx tsc --noEmit`.

**Dois repositórios espelhados** — toda feature/correção é replicada nos dois
(`sst-manager-trabalho` = própria; `sst-manager` = comercial/white-label). As únicas diferenças
são branding/white-label. Ao espelhar, copie a lógica verbatim e ajuste só o branding.

**Migrations:** numeradas em `supabase/migrations/`; aplicadas via Dashboard (Supabase local pode
não estar disponível). Sinalize quando uma migration precisar ser aplicada manualmente.

**Anonimato (psicossocial):** tabelas de resposta são deny-all (RLS); leitura só via service role no
servidor. Nunca exponha resposta individual; respeite k-anonimato (`min_respondentes`).

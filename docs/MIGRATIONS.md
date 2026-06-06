# Migrations & ambiente de banco (fluxo seguro)

Este projeto usa **Supabase**. Para nunca mais aplicar uma migration direto em
produção sem validar, adotamos o fluxo **local-first**: cada mudança de schema é
testada num Postgres efêmero local (idêntico ao Supabase, com `auth`/`storage`)
antes de ir para produção.

> Regra de ouro: **produção nunca recebe uma migration que não subiu limpa local + CI.**

## Pré-requisitos (uma vez por máquina)
- **Docker Desktop** rodando (o stack local do Supabase roda em containers).
- **Supabase CLI**: `npm i -g supabase` ou use via `npx supabase`.

## Ambientes
| Ambiente | O que é | Como muda |
|---|---|---|
| **Local** | Stack efêmero na sua máquina (`supabase start`) | livre — destrua/recrie à vontade |
| **CI** | Postgres efêmero no GitHub Actions (`.github/workflows/db-migrations.yml`) | automático em todo PR que toque `supabase/**` |
| **Produção** | Projeto Supabase real | só por passo deliberado (abaixo), após local + CI verdes |

Não há projeto de *staging* dedicado — o **local** é a camada de validação.

## Fluxo de uma mudança de schema
1. **Crie a migration**:
   ```bash
   npm run db:new minha_mudanca      # cria supabase/migrations/<ts>_minha_mudanca.sql
   ```
   (ou crie o arquivo `NNNN_nome.sql` seguindo a numeração existente)
2. **Teste local do zero**:
   ```bash
   npm run db:start                  # sobe o stack (1ª vez aplica tudo)
   npm run db:reset                  # DROPA e REAPLICA todas as migrations — falha se quebrar
   ```
   Abra o **Studio** em http://localhost:54323 e confira tabelas/policies/dados.
3. **Abra o PR** → o CI (`DB migrations`) reaplica tudo do zero num Postgres limpo.
   Se passar, as migrations estão consistentes.
4. **Merge** → deploy do app (Vercel) pega o código.
5. **Aplique em produção** (passo deliberado — ver abaixo).

## Aplicar em produção (deliberado)
Uma vez, faça o `link` do projeto local com o remoto:
```bash
supabase link --project-ref <PROJECT_REF>     # pede a senha do banco
```
Depois, para publicar **apenas as migrations ainda não aplicadas**:
```bash
npm run db:push                                # supabase db push (mostra o diff e pede confirmação)
```
- Faça **backup/snapshot** antes (Supabase → Database → Backups).
- `db push` aplica só o que falta (rastreado em `supabase_migrations.schema_migrations`).

> ⚠️ **Baseline (uma vez):** as migrations antigas foram aplicadas fora da CLI.
> Antes do primeiro `db push`, marque-as como já aplicadas para não reexecutar:
> `supabase migration repair --status applied <versão>` para cada migration histórica
> (ou `supabase migration list` para ver o estado local × remoto). Faça isso com
> cuidado, conferindo `migration list` antes.

## Scripts disponíveis
| Script | Faz |
|---|---|
| `npm run db:start` / `db:stop` | sobe / derruba o stack local |
| `npm run db:reset` | reaplica todas as migrations do zero (local) |
| `npm run db:new <nome>` | cria nova migration |
| `npm run db:diff` | gera migration a partir de mudanças feitas no Studio local |
| `npm run db:push` | aplica migrations pendentes no projeto **linkado** (prod) |

## O que NÃO fazer
- ❌ Editar tabelas direto no SQL Editor de produção sem virar migration versionada.
- ❌ Rodar scripts que conectam direto no Postgres de produção para DDL ad-hoc.
- ❌ Mergear schema sem o CI de migrations verde.

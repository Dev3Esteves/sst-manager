# Integração com o Sistenge People

Contrato de integração entre o **Sistenge People** (fonte da verdade de cargos,
colaboradores e exames) e o **sst-manager**.

> Status: **infraestrutura pronta, inativa até configurar os segredos**. Os
> nomes de campo do contrato são uma proposta — ajuste em
> `src/lib/integracao/people/contrato.ts` quando o contrato real do People for
> definido. Toda a tradução para o modelo do SST vive nessa pasta
> (anti-corruption layer); o resto do sistema não conhece o People.

## Princípios
- **People é mestre** de cargos/colaboradores/exames. No SST eles ganham
  `external_id` (id no People) e `origem='people'` e são tratados como
  somente-leitura.
- **Webhook (People → SST)** para escrever; **API de leitura (SST → People)**
  para o People consumir o NR-01.
- Idempotência por `event_id`; autenticação por HMAC (webhook) e API key
  (leitura); migration aditiva (não quebra o que existe).

## Variáveis de ambiente
| Var | Uso |
|---|---|
| `PEOPLE_WEBHOOK_SECRET` | Segredo HMAC que valida o webhook recebido do People |
| `PEOPLE_API_KEY` | Chave que o People usa para ler as APIs do SST |

## A) Webhook: People → SST
`POST /api/integr/people/webhook`

- Header `x-people-signature: sha256=<hmac>` — HMAC-SHA256 do corpo bruto com `PEOPLE_WEBHOOK_SECRET`.
- Corpo:
```json
{
  "event_id": "evt_abc123",
  "event_type": "colaborador.upserted",
  "occurred_at": "2026-06-05T12:00:00Z",
  "data": { /* entidade conforme o tipo */ }
}
```
- `event_type`: `cargo.upserted|cargo.deleted|colaborador.upserted|colaborador.deleted|exame.upserted|exame.deleted`.
- Chaves de correlação: `external_id`, `empresa_cnpj`, `cargo_external_id`, `colaborador_cpf`, `obra_codigo`.
- Respostas: `200` processado/idempotente · `400` payload inválido · `401` assinatura inválida · `422` erro de dados (ex.: empresa não encontrada) · `503` integração não configurada.

Exemplo de `data` para `colaborador.upserted`:
```json
{
  "external_id": "ppl_1023",
  "nome_completo": "João da Silva",
  "cpf": "111.444.777-35",
  "empresa_cnpj": "11.222.333/0001-81",
  "cargo_external_id": "ppl_cargo_5",
  "obra_codigo": "OBR-001",
  "data_admissao": "2026-01-10",
  "ativo": true
}
```

## B) Leitura: SST → People (NR-01)
Autenticação: `Authorization: Bearer <PEOPLE_API_KEY>` (ou `x-api-key`).

- `GET /api/integr/v1/psicossocial/campanhas?empresa_cnpj=...` — lista campanhas (metadados).
- `GET /api/integr/v1/psicossocial/campanhas/{id}/resultados` — resultados **agregados** por GHE × dimensão. **Nunca** expõe respostas individuais (anonimato/LGPD).

## Pendências para ativação (quando vincular o People)
1. Confirmar o contrato real do People e ajustar `contrato.ts`/`sync.ts`.
2. Definir os segredos `PEOPLE_WEBHOOK_SECRET` e `PEOPLE_API_KEY` nos dois sistemas.
3. Backfill/dedupe dos cadastros locais existentes (casar por CPF/CNPJ e setar `external_id`).
4. Tornar a UI somente-leitura para registros com `origem='people'` (fase de corte, atrás de feature flag).

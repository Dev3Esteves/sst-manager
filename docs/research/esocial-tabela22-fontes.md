# Tabela 22 do eSocial — Fontes e validação do seed

## Versão do leiaute confirmada

**S-1.3 NT 06/2026** (rev. 09/04/2026), aprovada pela **Portaria Conjunta RFB/MPS/MTE nº 13 de 25/06/2024**, em produção desde **02/12/2024**.

## Fonte do seed

`Referencias/Tabelas esocial/TABELA22_v4_Conteudo.csv` (CSV oficial fornecido pela SISTENGE) — 94 agentes ativos, separador pipe (`|`), layout:

```
CODIGO|DESCRICAO|DTINICIO|DTFIM|TIPO
01.01.001|Arsênio e seus compostos|01012014||QUÍMICOS
...
```

Convertido para JSON via `scripts/convert-esocial-tabela22-csv.mjs` (idempotente, pode ser rerodado quando uma nova versão do CSV chegar).

## Composição

| Grupo | Tipo no CSV | Range de códigos | Total |
|-------|-------------|------------------|-------|
| Químico | QUÍMICOS | 01.xx.xxx | 65 |
| Físico | FÍSICOS | 02.xx.xxx | 18 |
| Biológico | BIOLÓGICOS | 03.xx.xxx | 7 |
| Associação | ASSOCIAÇÃO DE AGENTES NOCIVOS FÍSICOS, QUÍMICOS E BIOLÓGICOS | 04.xx.xxx | 2 |
| Outros | OUTROS AGENTES NOCIVOS | 05.01.001 | 1 |
| Ausência | AUSÊNCIA DE AGENTES NOCIVOS OU ATIVIDADES ESPECIAIS | 09.01.001 | 1 |
| **Total** | | | **94** |

Dois códigos químicos têm `DTFIM = 15/06/2022` (inativos, mantidos no catálogo com `ativo = false` para histórico):
- `01.19.020` Bisclorometil
- `01.19.037` 4-aminodifenil

## Códigos especiais (placeholders)

| Código | Para usar quando |
|--------|------------------|
| `05.01.001` | Agente nocivo presente mas **não consta no Anexo IV do Decreto 3.048/1999** — incluído por decisão judicial ou administrativa. |
| `09.01.001` | **Sem agente nocivo** previsto no Anexo IV. Usado para riscos ergonômicos, mecânicos/acidente e psicossociais — esses agentes ainda vão para o inventário do PGR mas **não geram aposentadoria especial** no S-2240. |

A validação no editor de risco (`validarCompatibilidadeEsocial` em `src/lib/validations/pgr.ts`) aceita:
- Risco físico/químico/biológico → grupos `fisico`/`quimico`/`biologico` ou `associacao`
- Risco ergonômico/acidente/psicossocial → `ausencia` (09.01.001) ou `outros` (05.01.001)

## Tabelas eSocial adjacentes (não usadas, mas mapeadas)

A pasta `Referencias/Tabelas esocial/` traz dezenas de outras tabelas. As relacionadas a risco são:

| Tabela | Conteúdo | Finalidade |
|--------|----------|------------|
| 22 | Agentes Nocivos (formato `XX.XX.XXX`) | **Usado aqui** — campo `codAgNoc` do S-2240 |
| 23 | Agentes Nocivos com `TEMPCONTR` + `ALIQ` (formato `XX.XX.XX`) | Mapeamento previdenciário (PPP/aposentadoria) — pode virar enriquecimento futuro |
| 24 | Classificações tributárias (não relacionado a riscos) | — |
| 27 | Substâncias químicas LINACH/IARC | Catálogo cancerígeno — possível enriquecimento |

## Como atualizar quando o eSocial publicar nova versão

1. Baixar `TABELA22_vN_Conteudo.csv` do portal eSocial e substituir o existente em `Referencias/Tabelas esocial/`.
2. Rodar `node scripts/convert-esocial-tabela22-csv.mjs <csv> data/esocial-tabela22.json`.
3. Rodar `node scripts/seed-esocial-tabela22.mjs` — upsert idempotente, atualiza descrições/status sem perder códigos custom.
4. Atualizar `versao_leiaute` no `convert-*.mjs` se houver mudança de leiaute (S-1.4 etc).

# Tabela 24 do eSocial — Fontes e validação do seed

## Versão do leiaute confirmada

**S-1.3 NT 06/2026** (rev. 09/04/2026), aprovada pela **Portaria Conjunta RFB/MPS/MTE nº 13 de 25/06/2024**, em produção desde **02/12/2024**.

Confirmação obtida via `WebFetch` em:
- https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-06-2026-rev-09-04-2026

## Status do seed `data/esocial-tabela24.json`

⚠ **PRÉ-VALIDADO — requer conferência manual contra o Anexo II oficial antes de uso em S-2240 de produção.**

A tabela canônica completa do Anexo II não pôde ser baixada nesta sessão:
- `https://www.gov.br/esocial/pt-br/tabelas-do-esocial` aponta para o portal SPA `frontend.esocial.gov.br/adm/`, que é JavaScript-only e não responde a `fetch` simples.
- URLs específicas de PDF do Anexo II (Plone-style) retornaram **404** em todas as variações testadas.
- WebFetch para mirrors de terceiros (GitHub, blogs de integradores) foi negado por permissão nesta execução.

## Critérios usados na montagem do seed

1. **Convenção SISTENGE** (precedente real): `02.01.001 = RUÍDO` — confirmado no PGR_GAROA (linha 271, `docs/research/pgr-sistenge-anatomia.md`). Esse mapeamento bate com a convenção pré-eSocial do PPP em papel e com a maioria das implementações de S-2240.
2. **Convenção pré-eSocial PPP** para ordem dos códigos físicos (02.01.xxx): ruído → vibração → calor → frio → radiações → pressões → umidade.
3. **Anexo IV do Decreto 3.048/1999** para flag `exige_aposentadoria_especial`.
4. **Códigos `XX.99.001`** como "outros não relacionados" (uso residual).
5. **`05.01.001 = Ausência de agente nocivo`** — convenção oficial citada na documentação técnica.

## Divergência conhecida com o agente de pesquisa

O agente que pesquisou a tabela retornou um CSV com `02.01.001 = Vibrações`, conflitando com o precedente SISTENGE e com a convenção PPP. **Não usado.** O seed segue a convenção SISTENGE.

## Lacunas conhecidas

- O Anexo II oficial pode ter **mais subdivisões em 01.xx** (alguns leiautes antigos chegavam a ~80 químicos).
- Códigos com sufixo `.002`, `.003`, ... (subitens dentro de uma família) **não foram populados** — só `.001` por família. Refinar quando o PDF oficial for baixado.
- Limites de tolerância (`limite_tolerancia`) foram inferidos das NRs correspondentes; alguns casos limítrofes (calor, vibrações) podem ter cláusulas adicionais.

## Como atualizar quando o Anexo II oficial for obtido

1. Baixar manualmente o "Anexo II — Tabelas (S-1.3 consolidado)" do portal eSocial.
2. Fazer diff contra `data/esocial-tabela24.json`.
3. Atualizar o JSON.
4. Rodar `node scripts/seed-esocial-tabela24.mjs` — upsert idempotente, atualiza descrição/grupo/flag sem perder códigos custom já cadastrados.
5. Atualizar `versao_leiaute` no script se necessário.

## URLs consultadas

| URL | Resultado |
|-----|-----------|
| https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-06-2026-rev-09-04-2026 | ✓ Confirmou versão S-1.3 |
| https://www.gov.br/esocial/pt-br/documentacao-tecnica | ✓ Mapeou estrutura |
| https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais | ✓ Apenas MOS legado v2.4 |
| https://www.gov.br/esocial/pt-br/tabelas-do-esocial | ✗ Aponta para SPA JS-only |
| https://frontend.esocial.gov.br/adm/dadosTabela/24 | ✗ Negado por permissão |
| Várias URLs Plone do PDF Anexo II | ✗ 404 |

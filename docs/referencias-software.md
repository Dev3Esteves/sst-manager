# Referências para o SST Manager

> Documento canônico de referências regulatórias, normativas e arquiteturais para
> construir e evoluir o SST Manager (a empresa — engenharia / data centers).
> Cada item traz fonte com URL, ano de vigência e ligação a uma feature do software.
>
> **Data desta síntese:** 2026-05-10
>
> **Pesquisas primárias (drill-down):**
> - [`docs/research/agent-a-esocial-kpis-legislacao.md`](research/agent-a-esocial-kpis-legislacao.md) — eSocial, KPIs (NBR 14280), legislação BR 2022-2026
> - [`docs/research/agent-b-standards-arquitetura.md`](research/agent-b-standards-arquitetura.md) — ISO/NBR, arquitetura multi-tenant, LGPD
> - [`docs/research/gap-analysis-software.md`](research/gap-analysis-software.md) — Inventário e gaps do estado atual
> - [`data/nr-catalog.json`](../data/nr-catalog.json) + UI `/referencias/nrs` — Catálogo de 38 NRs vigentes/revogadas

---

## Sumário
- [Parte I — Inventário de referências](#parte-i--inventário-de-referências)
  - [1. Base legal brasileira](#1-base-legal-brasileira)
  - [2. Normas Regulamentadoras (NRs)](#2-normas-regulamentadoras-nrs)
  - [3. Normas técnicas (ISO / NBR / NIOSH)](#3-normas-técnicas-iso--nbr--niosh)
  - [4. eSocial — eventos SST](#4-esocial--eventos-sst)
  - [5. Metodologias de análise de risco](#5-metodologias-de-análise-de-risco)
  - [6. Indicadores (KPIs)](#6-indicadores-kpis)
  - [7. Documentos exigidos por norma](#7-documentos-exigidos-por-norma)
  - [8. Treinamentos por NR](#8-treinamentos-por-nr)
  - [9. Arquitetura & escalabilidade](#9-arquitetura--escalabilidade)
  - [10. LGPD aplicada a SST](#10-lgpd-aplicada-a-sst)
- [Parte II — Mapeamento gap → feature](#parte-ii--mapeamento-gap--feature)
- [Parte III — Roadmap priorizado](#parte-iii--roadmap-priorizado)
- [Parte IV — Fontes oficiais (links permanentes)](#parte-iv--fontes-oficiais-links-permanentes)

---

# Parte I — Inventário de referências

## 1. Base legal brasileira

| Ato | Escopo | Ano | URL |
|-----|--------|-----|-----|
| **CLT — Decreto-lei 5.452/43**, arts. 154-201 (Cap. V — Da Segurança e Medicina do Trabalho) | Base SST CLT | 1943 (regulamento atual via Lei 6.514/77) | https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm |
| **Lei 6.514/77** | Reforma da CLT — institui Cap. V SST e dá base para as NRs | 1977 | https://www.planalto.gov.br/ccivil_03/leis/l6514.htm |
| **Portaria MTb 3.214/78** | Instituiu as Normas Regulamentadoras (NRs) | 1978 | https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho |
| **Lei 8.213/91** (arts. 19-23, 169) | Acidente do trabalho, CAT, B91/B92/B93/B94 | 1991 | https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm |
| **Decreto 3.048/99** | Regulamento da Previdência Social — aposentadoria especial, PPP | 1999 (com alterações) | https://www.planalto.gov.br/ccivil_03/decreto/d3048.htm |
| **Lei 13.467/17** (Reforma Trabalhista) | Insalubridade negociável quanto à forma; banco de horas; 12×36 | 2017 | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm |
| **Lei 13.709/18 (LGPD)** | Tratamento de dados pessoais; **art. 11** — dados sensíveis (saúde) | 2018 | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm |
| **Lei 14.442/22** (teletrabalho) | Empregador responde por ergonomia em home-office | 2022 | https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14442.htm |
| **Lei 14.457/22 — CIPA + Assédio** | Renomeia CIPA → "Comissão Interna de Prevenção de Acidentes e de **Assédio**"; obriga canal de denúncia + treinamento anual | 2022 (vigência ~20/03/23) | https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14457.htm |
| **Portaria MTE 1.419/2024** | Inclui **riscos psicossociais** no PGR/GRO (NR-1); adequação plena até **25/05/2026** | 2024 | gov.br/trabalho-e-emprego (DOU) |
| **Portaria MTP 423/2021** | Cronograma de adoção do PGR (em vigor desde 03/01/2022) | 2021 | gov.br/trabalho-e-emprego |
| **Portaria SEPRT 6.730/2020** | Reforma da NR-1 introduzindo GRO/PGR (substituiu PPRA) | 2020 | gov.br/trabalho-e-emprego |
| **Portaria MTP 4.219/22** | Atualização da NR-5 incorporando Lei 14.457 | 2022 | gov.br/trabalho-e-emprego |
| **Súmula 443 TST** | Dispensa discriminatória — relevante para retaliação pós-denúncia | — | https://www.tst.jus.br |

> ⚠️ A portaria sobre psicossociais foi confirmada na pesquisa como **MTE 1.419/2024**. O briefing original mencionava "MTP 1.378/2023" — divergência sinalizada em `agent-a-esocial-kpis-legislacao.md` §6.

---

## 2. Normas Regulamentadoras (NRs)

- **Índice oficial:** https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes
- **Catálogo no app:** [`/referencias/nrs`](../src/app/(app)/referencias/nrs/page.tsx) (38 NRs, 36 vigentes, 2 revogadas — NR-02 e NR-27)
- **Dados estruturados:** [`data/nr-catalog.json`](../data/nr-catalog.json) (numero, titulo, status, ementa, fonte_url, pdf_url)

### NRs prioritárias para a empresa (engenharia / construção / data center)

| NR | Tema | Por que importa pra empresa |
|----|------|------------------------------|
| **NR-01** | Disposições Gerais + GRO/PGR | Documento mestre — todas as obras precisam de PGR |
| **NR-04** | SESMT | Dimensionamento por CNAE × empregados |
| **NR-05** | CIPA + Assédio (Lei 14.457) | Dimensionamento, eleição, atas, canal de denúncia |
| **NR-06** | EPI | Ficha de EPI, treinamento, controle de CA |
| **NR-07** | PCMSO | Programa + ASOs por colaborador |
| **NR-09** | Agentes físicos, químicos, biológicos | Avaliação ambiental — base do S-2240 |
| **NR-10** | Eletricidade | Núcleo das obras da empresa — SEP + curso 40h+40h |
| **NR-11** | Transporte/movimentação | Içamento em obra |
| **NR-12** | Máquinas | Maquinário de obra; gestão de salvaguardas |
| **NR-15** | Insalubridade | Caracterização ambiental, adicional |
| **NR-16** | Periculosidade | Sistema elétrico — adicional 30% |
| **NR-17** | Ergonomia | Escritório + obra; AET por função |
| **NR-18** | Construção | Obra civil — PCMAT virou PGR-Construção |
| **NR-20** | Inflamáveis/combustíveis | Classificação Cl. I-III; treinamento por grau |
| **NR-23** | Incêndio | Brigada (cruza com NBR 14276) |
| **NR-26** | Sinalização | Cores e sinalização de segurança |
| **NR-33** | Espaços confinados | Galerias, dutos, salas técnicas confinadas |
| **NR-35** | Trabalho em altura | Estruturas, fachadas, sub-estações |

### Atualizações 2024-2026 a observar

| Atualização | Impacto | Prazo |
|-------------|---------|-------|
| NR-1 + Port. 1.419/24 — riscos psicossociais no PGR | Novo capítulo obrigatório no PGR | até **25/05/2026** |
| NR-5 + Lei 14.457 — CIPA renomeada, treinamento de assédio | Treinamento anual obrigatório, canal de denúncia | em vigor |
| NR-18 — alinhamento NR-1 | PGR-Construção substitui PCMAT | em vigor |
| NR-7 — alinhamento NR-1 | PCMSO ancorado no PGR | em vigor |

---

## 3. Normas técnicas (ISO / NBR / NIOSH)

### ISO — gestão SST

| Norma | Tema | Revisão | URL |
|-------|------|---------|-----|
| **ISO 45001** | Sistemas de gestão SST (substitui OHSAS 18001) | 2018 | https://www.iso.org/standard/63787.html |
| **ISO 45003** | Saúde psicossocial no trabalho (extensão da 45001) | 2021 | https://www.iso.org/standard/64283.html |
| **ISO 31000** | Gestão de riscos — princípios e diretrizes | 2018 | https://www.iso.org/standard/65694.html |
| **ISO/IEC 31010** | Catálogo de 41 técnicas de avaliação de risco | 2019 | https://www.iso.org/standard/72140.html |
| **ISO 14001** | Gestão ambiental (companheira em SGI) | 2015 | https://www.iso.org/standard/60857.html |
| **ISO 9001** | Qualidade (companheira em SGI) | 2015 | https://www.iso.org/standard/62085.html |
| **ISO/IEC 27001** | Segurança da informação (crítica em data centers) | 2022 | https://www.iso.org/standard/27001 |

### Estrutura da ISO 45001 (Annex SL — comum a 9001 e 14001)

| Cláusula | Tema | Aderência atual do SST Manager |
|----------|------|-------------------------------|
| 4. Contexto da organização | Partes interessadas, escopo | ❌ não modelado |
| 5. Liderança e **participação dos trabalhadores** | Política SST, consulta | Parcial — não há trilha formal de consulta |
| 6.1 Identificação de perigos, riscos e oportunidades | Inventário de riscos | Parcial — `cargos.riscos_associados` (jsonb) |
| 6.1.3 Requisitos legais | Compliance com NRs | ✓ (catálogo NR) |
| 6.2 Objetivos SST | Metas e KPIs | Parcial — sem tabela `objetivos` |
| 7.5 Informação documentada | Procedimentos versionados | ❌ sem versionamento |
| 8.1.2 **Hierarquia de controles** (NIOSH) | Justificar nível de controle | ❌ sem campo |
| 8.1.3 Gestão de mudanças | Workflow de MOC | ❌ |
| 8.1.4 Aquisições/contratados | Onboarding de prestadoras | Parcial via `empresas` |
| 8.2 Emergências | Plano + simulados | ❌ |
| 9.1.2 Avaliação de conformidade legal | Relatório por NR | ❌ |
| 9.2 Auditoria interna | Plano + relatórios | ❌ |
| 9.3 Análise crítica pela direção | Atas estruturadas | ❌ |
| 10. Não conformidades e ações corretivas | NC + ação + verificação eficácia | Parcial (jsonb solto em `ocorrencias.acoes_corretivas`) |

### NBRs aplicáveis (construção + data center)

| NBR | Tema | Revisão |
|-----|------|---------|
| **NBR 14280** | Cadastro de acidente — define TF/TG e dias debitados | 2001 (Errata 2003) |
| **NBR 14276** | Brigada de incêndio — requisitos | 2020 |
| **NBR 9050** | Acessibilidade | 2020 (Emenda 1) |
| **NBR 5410** | Instalações elétricas BT | 2004 (revisão 2026 em curso) |
| **NBR 14039** | Instalações elétricas MT (1-36,2 kV) | 2021 |
| **NBR 16001** | Responsabilidade social (ESG) | 2012 |
| **NBR ISO/IEC 27017 / 27018** | Controles em nuvem / PII em nuvem | 2016 |
| **NBR 16280** | Reforma em edificações | 2020 |
| **NBR 7678** | Segurança em obras de construção | 1983 |
| **NBR 6494** | Andaimes | 1990 |

> Catálogo: https://www.abntcatalogo.com.br

### NIOSH Hierarchy of Controls

```
1. Elimination      ← mais efetiva
2. Substitution
3. Engineering controls
4. Administrative controls
5. PPE              ← último recurso
```

Fonte: https://www.cdc.gov/niosh/hierarchy-of-controls/about/index.html
Referenciada explicitamente em ISO 45001 cl. 8.1.2 e NR-1 (PGR).

---

## 4. eSocial — eventos SST

- **Versão vigente:** **S-1.3** (NT 06/2026, rev. 09/04/2026)
- **MOS:** S-1.3 consolidado até NO 10/2026 — https://www.gov.br/esocial/pt-br/documentacao-tecnica
- **XSDs:** pacote v_S_01_03_00 publicado 27/04/2026

| Evento | Função | Prazo de envio | Schema | Status no SST Manager |
|--------|--------|----------------|--------|----------------------|
| **S-2210** | CAT (Comunicação de Acidente do Trabalho) | 1º dia útil seguinte; óbito antes do sepultamento | `evtCAT` | **Parcial** — XML gerado em [`/api/ocorrencias/[id]/cat-xml`](../src/app/api/ocorrencias/[id]/cat-xml/route.ts); sem envio assinado |
| **S-2220** | Monitoramento da Saúde (ASO) | dia 15 do mês seguinte; admissional antes do início | `evtMonit` | ❌ Gerador XML inexistente |
| **S-2240** | Condições Ambientais (substitui PPP gradualmente) | dia 15 mês seguinte à mudança; vigência | `evtExpRisco` | ❌ Sem cadastro de agentes nocivos nem GHE |
| **S-2245** | Treinamentos, Capacitações, Simulados | dia 15 do mês seguinte à realização | `evtTreinCap` | ❌ Gerador XML inexistente |

### Tabelas eSocial relevantes
- **Tabela 13** — Parte do corpo atingida
- **Tabela 14** — Agente causador do acidente
- **Tabela 24** — Agentes nocivos (para S-2240) — **cadastro ainda ausente no app**
- **Tabela 27** — Categorias do trabalhador

### Substituição do PPP
- **Decisão MTE/INSS jan/2023 — Portaria Conjunta MTP/MS nº 4:** PPP eletrônico passa a ser gerado pelo INSS (Meu INSS / CNIS) **a partir** de S-2210 + S-2220 + S-2240.
- Aposentadoria especial passa a depender da qualidade desses 3 eventos.

---

## 5. Metodologias de análise de risco

> Catálogo completo: **ISO/IEC 31010:2019** — 41 técnicas.

| Técnica | Tipo | Esforço | Quando aplicar | Onde caberia no app |
|---------|------|---------|----------------|---------------------|
| **JSA / AST** | Qualitativo, tarefa | Baixo | Pré-tarefa, obra | ✓ APR em `/documentos/apr` |
| **APR (5×5)** | Qualitativo, P×S | Baixo | Início de qualquer atividade não-rotineira | ✓ Existe + IA classifica |
| **Bowtie** | Qualitativo, cenário | Médio | Eventos críticos, comunicação executiva | ❌ módulo novo `/riscos/cenarios` |
| **FMEA** | Semi-quant., componente | Médio-alto | Projeto/processo, instalações novas | ❌ |
| **HAZOP** | Qualitativo, P&ID | Alto | Sistemas com fluidos (HVAC data center, supressão FM-200) | ❌ |
| **FTA** | Quantitativo, causa | Alto | Investigação pós-acidente, confiabilidade SIS | ❌ |
| **LOPA** | Semi-quant., camadas | Médio | Após HAZOP — justificar SIL | ❌ |
| **What-if/Checklist** | Qualitativo | Baixo | Brainstorm + checklist NR | Parcial via `templates_inspecao` |
| **5 Whys + Ishikawa** | Causa raiz | Baixo | Pós-ocorrência | ❌ `ocorrencias.causa_raiz` é texto livre |
| **5W2H** | Plano de ação | Baixo | PGR, NCs, ações corretivas | ❌ `acoes_corretivas` (jsonb solto) |

Referências:
- OSHA 3071 (JSA): https://www.osha.gov/Publications/osha3071.html
- IEC 61882 (HAZOP), IEC 61025 (FTA): https://webstore.iec.ch
- CCPS Bowtie / LOPA: https://www.aiche.org/ccps
- AIAG-VDA FMEA Handbook 2019: https://www.aiag.org

---

## 6. Indicadores (KPIs)

### Lagging — NBR 14280 (base 1.000.000h)
| Indicador | Fórmula | Status no app |
|-----------|---------|---------------|
| **TF** Taxa de Frequência | `(acidentes_com_lesão × 1.000.000) / HHT` | Calculado em `/relatorios/mensal`, mas com HHT hardcoded `66_000` |
| **TG** Taxa de Gravidade | `((dias_perdidos + dias_debitados) × 1.000.000) / HHT` | Idem — sem tabela de dias debitados |
| **HHT** Horas-Homem Trabalhadas | `Σ horas_efetivas_no_periodo` (sem afastamento/férias/falta; com hora-extra) | ❌ sem ingestão; constante hardcoded |

### Lagging — OSHA (base 200.000h)
| Indicador | Fórmula |
|-----------|---------|
| **LTIR** Lost Time Injury Rate | `(LTI × 200.000) / HHT` |
| **TRIR** Total Recordable Injury Rate | `(recordable × 200.000) / HHT` |
| **DART** Days Away, Restricted or Transferred | `(DART_cases × 200.000) / HHT` |
| **Severity Rate** | `(dias_perdidos × 200.000) / HHT` |

> Útil quando a empresa atende cliente data center multinacional que compara contra padrões OSHA.

### Leading — proativos
- % DDS realizados / planejados
- % inspeções fechadas no prazo
- **Near-miss rate** (nº de quase-acidentes reportados / período)
- % treinamentos no prazo (matriz cumprida)
- % colaboradores com EPI dentro da validade
- MTTR de não-conformidade
- Cobertura de APRs (% atividades não-rotineiras com APR)

### Razão Heinrich / Bird
- Heinrich (1931): 1 fatal : 29 graves : 300 quase-acidentes
- Bird (1969): 1 grave : 10 leves : 30 danos materiais : 600 quase-acidentes
- **Cultura saudável:** razão near-miss : acidente real ≥ **30:1**

### Custo
- **CA** = custos diretos (INSS, salários afastamento, atendimento) + custos indiretos (Heinrich propõe 4× diretos)
- **Benchmark setorial:** AEAT — https://www.gov.br/previdencia/pt-br/assuntos/previdencia-social/saude-e-seguranca-do-trabalhador (atual: AEAT 2022/2023, edição 2024 a verificar)
  - a empresa provavelmente CNAE 41/42/43 (construção) e 43.21-5 (instalações elétricas) — historicamente top-5 em frequência

---

## 7. Documentos exigidos por norma

| Documento | Norma de origem | Status no app | Onde no schema |
|-----------|-----------------|---------------|----------------|
| **OS NR-01** (Ordem de Serviço) | NR-1 | ✓ Gerado em `/documentos/os-nr01/new` | `documentos_sst.tipo='os_seguranca'` |
| **PGR** (Programa de Gerenciamento de Riscos) | NR-1 + Port. 1.419/24 | ❌ | — |
| Inventário de Riscos (parte do PGR) | NR-1 | Parcial — `cargos.riscos_associados` (jsonb) | precisa promoção a entidade |
| Plano de Ação (parte do PGR) | NR-1 | ❌ | — |
| **PCMSO** (Programa) | NR-7 | Registros sim, programa anual ❌ | `exames_medicos` |
| **LTCAT** | Lei 8.213, IN INSS | ❌ | — |
| **PPP** (Perfil Profissiográfico) | Lei 8.213 + Decreto 3.048 | ❌ — desde 2023 gerado pelo INSS a partir de S-2240 | depende do S-2240 |
| **Mapa de Risco** (gráfico) | NR-5 item 5.16 | ❌ | — |
| **ASO** | NR-7 | ✓ | `exames_medicos` |
| **CAT** | Lei 8.213 + S-2210 | Parcial (XML, sem envio) | `ocorrencias` + `/api/ocorrencias/[id]/cat-xml` |
| **APR** | NR-1 / NR-18 | ✓ + IA classificação | `documentos_sst.tipo='apr'` |
| **PT** (Permissão de Trabalho) | NR-1 / NR-33 / NR-35 | ✓ | `documentos_sst.tipo='pt'` |
| **Autorização NR-10/33/35** | NRs respectivas | ✓ | `documentos_sst.tipo='autorizacao_nr10'` etc. |
| **Ficha de EPI** cumulativa | NR-6 | ✓ | `epis` + `epi_entregas` + `/api/colaboradores/[id]/ficha-epi/pdf` |
| **DDS** (Diálogo Diário) | NR-1 / NR-18 anexo I (prática consolidada) | ✓ | `documentos_sst.tipo='dialogo_seguranca'` |
| **Análise de Acidente** (estruturada) | NR-1 + ISO 45001 cl. 10 + NBR 14280 | Parcial — `ocorrencias.investigacao` jsonb | precisa estrutura: 5W + Ishikawa + ações |
| **Procedimento de Trabalho Seguro (PTS)** | ISO 45001 cl. 7.5 | ❌ sem versionamento | — |
| **Brigada de Incêndio** (cadastro + treinamento) | NR-23 + NBR 14276 | ❌ | — |
| **Plano de Emergência** | NR-1 / ISO 45001 cl. 8.2 | ❌ | — |
| **Ata CIPA + Eleição** | NR-5 | ❌ | — |
| **Canal de denúncia de assédio** | Lei 14.457 art. 23 | ❌ | — |
| **Política de SST** assinada pela direção | ISO 45001 cl. 5.2 | ❌ | — |
| **Análise crítica pela direção** | ISO 45001 cl. 9.3 | ❌ | — |
| **Auditoria interna** | ISO 45001 cl. 9.2 | ❌ | — |

---

## 8. Treinamentos por NR

| NR | Treinamento | CH inicial | Reciclagem | Status no app |
|----|-------------|------------|------------|---------------|
| **NR-1** | Capacitações harmonizadas (módulo NR-1 + NR específica) | varia | varia | Catálogo em `treinamentos` |
| **NR-5** | CIPA — membros eleitos | 20h | Anual | Catálogo |
| **NR-6** | EPI — uso/conservação/guarda | varia (por EPI/atividade) | quando trocar | Catálogo |
| **NR-10** | Básico SEP | 40h | 2 anos | Catálogo |
| **NR-10** | Complementar SEP (Sistema Elétrico de Potência) | 40h | 2 anos | Catálogo |
| **NR-11** | Operador de equipamento de transporte motorizado | varia | — | Catálogo |
| **NR-12** | Operadores/mantenedores de máquinas | varia | — | Catálogo |
| **NR-18** | Integração (admissão em obra civil) | 6h mín. | — | Catálogo |
| **NR-20** | Classes I a IV (básico/intermediário/avançado/específico) | 4-32h | 1-3 anos | Catálogo |
| **NR-22** | Mineração (não a empresa) | — | — | — |
| **NR-33** | Trabalhador autorizado / Supervisor de entrada | 16h / 40h | Anual | Catálogo |
| **NR-34** | Construção naval | — | — | — |
| **NR-35** | Trabalho em Altura | 8h | 2 anos | Catálogo |
| **NR-23** + **NBR 14276** | Brigada de incêndio | varia | — | ❌ não modelado distintamente |
| **Lei 14.457** | Prevenção de assédio | livre | **anual obrigatório** | ❌ falta na matriz |
| **PCMSO/NR-7** | Capacitação de quem aplica/realiza exames | — | — | — |

> Catálogo atual: tabela `treinamentos` (titulo, nr_referencia, carga_horaria_horas, validade_meses, modalidade) + `treinamentos_realizados` (per colaborador) — schema robusto, basta popular o catálogo de referência com as periodicidades-padrão.

---

## 9. Arquitetura & escalabilidade

### Stack atual
- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres + Auth + Storage + RLS)
- `@react-pdf/renderer` (PDFs leves)
- Tesseract.js client-side (OCR para ASOs)
- IndexedDB (offline para inspeções)
- Vercel Cron + tabela `jobs` com `SKIP LOCKED` (fila assíncrona)
- Anthropic SDK 0.95.1 (Haiku 4.5 para classificação de risco)

### Multi-tenant Postgres — shared schema + RLS

**Padrão atual:** `empresa_id` em cada tabela tenant-aware + função `user_empresa_id()` em policies.

**Otimizações recomendadas:**
- Envolver `auth.uid()` em sub-select: `using ((select auth.uid()) = user_id)` — evita re-execução por row
- Indexar colunas RLS (`empresa_id`, `user_id`) — RLS adiciona predicado mas só usa índice se existir
- `SECURITY DEFINER` para joins cross-tenant em queries admin
- PK/FK/UNIQUE **bypassam RLS** — preferir UUID v7 (não vazar IDs sequenciais entre tenants)

**Ceiling estimado:** ~1.000 tenants ativos, ~100M linhas em tabelas críticas, p95 < 200ms com RLS bem indexado e Supabase Pro compute Large+.

**Quando migrar para schema-per-tenant ou DB-per-tenant:**
- 1-2 tenants enterprise > 30% do volume → contenção
- Requisito contratual de residência de dados ou BYOK
- Cliente exige SOC2 do **seu** banco isolado

**Refs:**
- https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv

### Audit log append-only + particionamento

**Necessidade legal:**
- CAT: 10-20 anos (prática: 30 anos por ação regressiva INSS)
- ASO: 20 anos pós-desligamento (NR-7 item 7.4.5.1)
- PPP/LTCAT/PGR: mínimo 20 anos

**Padrão:**
- Tabela `audit_log` com RLS permitindo apenas INSERT (nunca UPDATE/DELETE)
- `PARTITION BY RANGE (created_at)` mensal — quentes em SSD, frias arquivadas
- Trigger genérico (`pgaudit` ou custom) em todas as tabelas
- Selagem de documentos legais: SHA-256 do conteúdo + carimbo de tempo ICP-Brasil (RFC 3161)

### eSocial integration architecture

**Padrão outbound queue:**
1. Evento de negócio (ASO emitido) → grava em `eventos_esocial_pendentes` (payload JSON normalizado)
2. Worker puxa → gera XML conforme XSD → assina com certificado A1 (XMLDSig + C14N exclusive)
3. Envia ao WS eSocial → persiste protocolo → agenda polling de retorno
4. Consulta lote → persiste recibo → atualiza estado `transmitido` ou `rejeitado`

**Certificado:**
- **A1** (arquivo .pfx, validade 1 ano) — único compatível com serverless; guardar em Vercel encrypted env (≤64KB) ou KMS/Vault
- **A3** (token/cartão, validade 3 anos) — impossível em serverless puro; oferecer via agente local instalado no cliente

**Resiliência:**
- Idempotência por `eventoId` (hash determinístico)
- Backoff exponencial; máx. 5 retries em 24h → dead-letter queue
- Postgres LISTEN/NOTIFY + advisory locks (suficiente até volume alto)

**Libs de referência:** ACBr (Delphi, canônica) — https://projetoacbr.com.br; esocial4j (Java) — https://github.com/esocial/esocial4j

### Document generation pipelines (PDF em escala)

| Cenário | Stack |
|---------|-------|
| On-demand simples (ficha EPI, ASO, OS NR-01) | `@react-pdf/renderer` em Vercel function — ✓ atual |
| Batch grande (PGR completo, 200pg com gráficos) | Serviço dedicado (Fly.io/Fargate) + fila + Storage signed URL |
| Alta fidelidade (contratos, documentos finos) | Puppeteer em container, **fora do Vercel** |

**Selagem:** após emissão de documento legal — gravar PDF original + manifest JSON em bucket imutável (Object Lock S3 ou Supabase bucket com policy "no DELETE"). Hash SHA-256 + assinatura ICP-Brasil + timestamp.

### 12-Factor aplicado
| Factor | Aplicação |
|--------|-----------|
| III. Config | Env vars Vercel; **certificado A1 e secrets em KMS, nunca repo** |
| VI. Processes | Vercel functions stateless; nada em `/tmp` entre requests |
| X. Dev/prod parity | Supabase CLI local + migrations versionadas + seed reprodutível ✓ |
| XI. Logs | Structured JSON ✓ (já implementado — `src/lib/logger.ts`) |

### Domain-Driven Design — bounded contexts candidatos
1. **Gestão de Empresa & Lotação**
2. **Gestão de Pessoas SST** (Colaborador, Cargo, Lotacao, ExposicaoAgentes)
3. **Documentação Legal** (PGR, PCMSO, ASO, LTCAT, Ficha EPI, OS NR-01)
4. **Riscos & Controles** (Risco, Controle, Inspecao)
5. **Ocorrências** (Ocorrencia, CAT, NearMiss, Investigacao, AcaoCorretiva)
6. **Treinamentos & Capacitação**
7. **Integrações Externas** (EventoESocial, ERP)

**Sugestão:** começar separando "Documentação Legal" e "Integrações Externas" do core operacional **antes** do produto crescer.

**Refs:** Eric Evans (Blue Book), Vaughn Vernon (IDDD), https://martinfowler.com/bliki/BoundedContext.html

---

## 10. LGPD aplicada a SST

**Base legal:** Lei 13.709/18 — art. 5º II (saúde = dado sensível), art. 11 (hipóteses para tratar sensíveis), art. 16 (retenção limitada — conflito com NR-7 20 anos, **solução:** documentar base "obrigação legal").

**Hipóteses aplicáveis a ASO/PCMSO:**
- Art. 11 II(a) — cumprimento de obrigação legal pelo controlador (NR-7, NR-15, eSocial)
- Art. 11 II(f) — tutela da saúde, por profissional de saúde

> **Consentimento não é necessário** quando há obrigação legal (interpretação consolidada).

**Padrões técnicos para o app:**
- ✓ Encryption at rest (Supabase AES-256 default)
- ✓ Encryption in transit (TLS 1.2+)
- ✓ RLS por `empresa_id`
- ❌ **Granular role** (gestor SST vê apto/inapto; médico vê CID; RH só metadados)
- ❌ **Log de acesso a dado sensível** (audit_log atual cobre escrita, **não leitura/SELECT**)
- ❌ **ROPA** — Registro de Operações de Tratamento (Art. 37)
- ❌ **Política de retenção automatizada** — purga após 20 anos
- ❌ **Portal do titular** (Art. 18 — acesso, retificação, eliminação)
- ❌ Apontamento de **DPO/Encarregado** + canal público

**Anonimização vs pseudonimização:**
- Pesquisa interna → pseudonimizar (hash com salt por estudo)
- Descarte pós-retenção → anonimizar (remover quasi-identificadores)

**Refs:**
- https://www.gov.br/anpd/pt-br/centrais-de-conteudo/documentos-tecnicos-orientativos
- https://supabase.com/docs/guides/platform/security

---

# Parte II — Mapeamento gap → feature

Priorização **P0** (regulatório bloqueante) → **P3** (melhoria contínua).

## P0 — Regulatório crítico

| Gap | Origem | Onde no software | Esforço |
|-----|--------|------------------|---------|
| **PGR estruturado** (Inventário + Plano de Ação) com capítulo de **psicossociais** | NR-1 + Port. MTE 1.419/24 — prazo 25/05/2026 | Novo módulo `/pgr` + promover `cargos.riscos_associados` para tabela `riscos` + nova `pgr_acoes_5w2h` | Alto |
| **Cadastro de agentes nocivos** (Tabela 24 eSocial) + **GHE** | eSocial S-2240 | Tabela `agentes_nocivos` + `grupos_homogeneos_exposicao` + relacionamento com `obra`/`cargo` | Alto |
| **Gerador XML S-2220** (ASO) | eSocial S-2220 | `/api/exames/[id]/esocial-xml` análogo ao CAT-XML | Médio |
| **Gerador XML S-2240** (Condições Ambientais) | eSocial S-2240 | `/api/obras/[id]/esocial-s2240` | Alto (depende de agentes+GHE) |
| **Gerador XML S-2245** (Treinamentos) | eSocial S-2245 | `/api/treinamentos/realizacoes/[id]/esocial-xml` | Médio |
| **Módulo CIPA** (Lei 14.457): eleição, mandato, atas, treinamento anual de assédio, **canal de denúncia anônimo** | Lei 14.457/22 + NR-5 | Novo módulo `/cipa` + nova tabela `denuncias_assedio` com criptografia | Alto |
| **Assinatura XML + outbound queue eSocial** (cert A1) | Todos os eventos eSocial | `src/lib/esocial/` + `eventos_esocial_pendentes` + worker | Alto |

## P1 — Aderência ISO + indicadores

| Gap | Origem | Onde no software | Esforço |
|-----|--------|------------------|---------|
| **HHT real** (não hardcoded 66.000) | NBR 14280 | Tabela `apontamento_horas` + cálculo em `src/lib/utils/relatorio-mensal.ts` | Médio |
| **Tabela de dias debitados** (NBR 14280) | NBR 14280 | Catálogo fixo seedado | Baixo |
| **Near-miss** com fluxo simplificado + dashboard segregado | NBR 14280 + Heinrich/Bird | `ocorrencias.tipo='quase_acidente'` já existe — falta UI mobile-first + razão fatal:grave:leve:near-miss | Baixo |
| **Análise de Acidente estruturada** (5 Whys + Ishikawa + ações vinculadas) | ISO 45001 cl. 10 | Promover `ocorrencias.investigacao` para tabela `analise_acidente` + `nao_conformidades` + `acoes_corretivas` (com responsável, prazo, verificação de eficácia) | Médio |
| **Hierarquia de controle NIOSH** em cada risco/controle | ISO 45001 cl. 8.1.2 + NR-1 | Campo `nivel_hierarquia_controle` (enum 1-5) em controle, alerta quando só admin/EPI | Baixo |
| **Indicadores leading** | OSHA/Heinrich | Dashboard `/relatorios/leading-indicators` com % DDS, % inspeções, MTTR NC, % treinamentos no prazo | Médio |
| **LTIR/TRIR/DART** (base 200k OSHA) | Boas práticas multinacionais | Adicionar em `/relatorios/mensal` paralelo a TF/TG | Baixo |

## P2 — ISO 45001 (preparação para certificação)

| Gap | Cláusula | Esforço |
|-----|----------|---------|
| **Auditoria interna** (plano, ciclo, relatório, não conformidades) | 9.2 | Médio |
| **Análise crítica pela direção** (pauta + atas + decisões + prazos) | 9.3 | Baixo |
| **Avaliação de conformidade legal** (compliance por NR) | 9.1.2 | Médio |
| **Objetivos SST + metas** com acompanhamento | 6.2 | Baixo |
| **Procedimentos versionados** (PTS, IT) com treinamento de conscientização | 7.5 | Médio |
| **Gestão de mudanças (MOC)** com workflow | 8.1.3 | Médio |
| **Plano de emergência + simulados** | 8.2 | Médio |
| **Política SST assinada pela direção** | 5.2 | Baixo |
| **Partes interessadas** (registro de stakeholders) | 4.2 | Baixo |

## P2 — LGPD & dados sensíveis

| Gap | Origem | Esforço |
|-----|--------|---------|
| **Role granular** médico/gestor/RH para dados de saúde | LGPD art. 11 + ANPD | Médio |
| **Log de SELECT** (acesso) a dados sensíveis | LGPD art. 37 | Médio |
| **ROPA** automatizado | LGPD art. 37 | Médio |
| **Política de retenção** com purga automatizada após 20 anos | LGPD art. 16 + NR-7 | Alto |
| **Portal do titular** (acesso, retificação, eliminação) | LGPD art. 18 | Alto |
| **Apontamento DPO + canal público** | LGPD art. 41 | Baixo |
| **Criptografia adicional aplicativa** em CID-10 do ASO | Boas práticas | Médio |

## P3 — Melhorias contínuas

| Gap | Esforço |
|-----|---------|
| **Mapa de risco** visual (planta + camadas) | Alto |
| **PCMSO relatório anual** (gerador) | Médio |
| **LTCAT** gerador (depende de medições higiênicas) | Alto |
| **PPP** gerador (depende de S-2240 estável) | Médio |
| **Plano de Emergência** específico | Médio |
| **Brigada de incêndio** (módulo dedicado com NBR 14276) | Médio |
| **Benchmark setorial AEAT** por CNAE | Médio |
| **Mobile-first inspeção** (offline ampliado, fotos) | Alto |
| **TAC tracker** (Termo de Ajustamento de Conduta com MPT) | Médio |
| **Modalidade de trabalho** (presencial/home/híbrido) em colaborador | Baixo |
| **Selagem de documentos** com hash + ICP-Brasil | Alto |

## Dívidas técnicas detectadas

| Item | Local | Severidade |
|------|-------|-----------|
| `HHT_MENSAL_ESTIMADO = 66_000` hardcoded | `src/app/(app)/relatorios/mensal/page.tsx:17` | Alto (afeta TF/TG) |
| `ocorrencias.causa_raiz TEXT` livre | `0001_core_schema.sql:211` | Alto |
| `ocorrencias.acoes_corretivas JSONB` solto | `0001_core_schema.sql:212` | Médio |
| 10 vulnerabilidades npm audit | `package-lock.json` | Médio |
| eslint 8.57 / glob 10.3 deprecated | devDeps | Baixo |
| `audit_log` sem particionamento | `0007_audit_log_trigger.sql` | Médio (vira pesado com volume) |
| Sem documentação de fórmulas TF/TG no código | `src/lib/utils/relatorio-mensal.ts` | Baixo |

---

# Parte III — Roadmap priorizado

Ordenação **R×E** (ROI × Esforço) para o contexto da empresa.

## Sprint pack A — Fundamentos (P0 imediato)
1. **PGR** estruturado (módulo + Inventário + Plano de Ação 5W2H)
2. **HHT real** + tabela de dias debitados NBR 14280
3. **Causa raiz estruturada** (5 Whys + Ishikawa + tabela `nao_conformidades` + `acoes_corretivas`)
4. **Catálogo de agentes nocivos** (Tabela 24 eSocial)

## Sprint pack B — Compliance regulatório (P0 contínuo)
5. **Módulo CIPA + Lei 14.457** (eleição, atas, canal de denúncia, treinamento anual de assédio)
6. **Riscos psicossociais** dentro do PGR (subtipo de risco) — prazo 25/05/2026
7. **Gerador XML S-2220** (ASO)
8. **Gerador XML S-2245** (Treinamentos)
9. **Outbound queue eSocial** + assinatura A1 + retry

## Sprint pack C — ISO 45001 ready (P1/P2)
10. Hierarquia de controle NIOSH em risco/controle
11. Auditoria interna + Análise crítica direção
12. Avaliação de conformidade legal (por NR)
13. Procedimentos versionados (PTS)
14. **GHE** (Grupo Homogêneo de Exposição) + S-2240

## Sprint pack D — Excelência operacional
15. Indicadores leading (DDS, inspeções, near-miss, treinamentos no prazo)
16. LTIR/TRIR/DART base OSHA
17. Mapa de risco visual
18. Mobile-first inspeção offline
19. PCMSO relatório anual

## Sprint pack E — LGPD by design
20. Role granular (médico/gestor/RH) para dados de saúde
21. Log de SELECT em dados sensíveis
22. ROPA + retenção automatizada + portal do titular

## Sprint pack F — Plataforma & escala
23. `audit_log` particionado por mês
24. Selagem de documentos com hash + ICP-Brasil
25. Refator em bounded contexts DDD ("Documentação Legal" e "Integrações Externas")
26. Read replicas + métricas pg_stat_statements + SLO p95

---

# Parte IV — Fontes oficiais (links permanentes)

### Governo / Legislação
- **eSocial — Documentação técnica:** https://www.gov.br/esocial/pt-br/documentacao-tecnica
- **eSocial — MOS S-1.3 NO 10/2026:** https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-3-consolidada-ate-a-no-s-1-3-10-2026.pdf
- **eSocial — XSDs v_S_01_03_00:** https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/2026-04-27_esquemas_xsd_v_s_01_03_00.zip
- **NRs (índice oficial):** https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes
- **Planalto (legislação):** https://www.planalto.gov.br
- **ANPD:** https://www.gov.br/anpd/pt-br
- **AEAT (Previdência):** https://www.gov.br/previdencia/pt-br/assuntos/previdencia-social/saude-e-seguranca-do-trabalhador
- **MPT:** https://mpt.mp.br

### Normas técnicas
- **ABNT Catálogo:** https://www.abntcatalogo.com.br
- **ISO 45001:** https://www.iso.org/standard/63787.html
- **ISO 45003:** https://www.iso.org/standard/64283.html
- **ISO 31000:** https://www.iso.org/standard/65694.html
- **ISO/IEC 31010:** https://www.iso.org/standard/72140.html
- **ISO 14001:** https://www.iso.org/standard/60857.html
- **ISO/IEC 27001:** https://www.iso.org/standard/27001
- **NIOSH Hierarchy of Controls:** https://www.cdc.gov/niosh/hierarchy-of-controls/about/index.html
- **OSHA 3071 (JSA):** https://www.osha.gov/Publications/osha3071.html

### Arquitetura & engineering
- **Postgres RLS:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Postgres partitioning:** https://www.postgresql.org/docs/current/ddl-partitioning.html
- **pgAudit:** https://www.pgaudit.org
- **Supabase RLS:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Supabase performance:** https://supabase.com/docs/guides/platform/performance
- **Supabase security:** https://supabase.com/docs/guides/platform/security
- **12-Factor:** https://12factor.net
- **Martin Fowler — DDD:** https://martinfowler.com/bliki/BoundedContext.html
- **Event Sourcing:** https://martinfowler.com/eaaDev/EventSourcing.html
- **AWS multi-tenant + RLS:** https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/

### Libs / referências eSocial
- **ACBr (Delphi, canônico):** https://projetoacbr.com.br
- **esocial4j (Java):** https://github.com/esocial/esocial4j

### Risco
- **CCPS (Bowtie, LOPA):** https://www.aiche.org/ccps
- **AIAG-VDA FMEA Handbook 2019:** https://www.aiag.org
- **IEC (HAZOP 61882, FTA 61025):** https://webstore.iec.ch

---

> **Próxima ação sugerida:** validar o roadmap (Parte III) com o time do projeto e escolher
> 2-3 itens do Sprint pack A para entrar nas próximas fases. O P0 PGR + HHT real são os
> que mais destravam outros (PGR habilita S-2240; HHT corrige TF/TG e todos os relatórios).

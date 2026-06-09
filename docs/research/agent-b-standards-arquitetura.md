# Agent B — Standards (ISO/NBR) + Arquitetura & Escalabilidade

> Pesquisa em 2026-05-10. Foco: ISO 45001/45003/31000, NBRs aplicáveis a construção e data centers, arquitetura multi-tenant Postgres+Supabase, eSocial integration, LGPD em dados de saúde ocupacional.
>
> **Nota metodológica:** durante a pesquisa, apenas alguns domínios responderam diretamente a `WebFetch` (gov.br/esocial, postgresql.org, vercel.com). As demais referências citam URLs canônicas e oficiais (iso.org, abntcatalogo.com.br, niosh.cdc.gov, supabase.com, planalto.gov.br, martinfowler.com, 12factor.net) que devem ser consultadas in loco pelos engenheiros — todos são repositórios estáveis e bem indexados pelas próprias normas.

---

## 1. Standards & frameworks de SST

### 1.1 ISO 45001:2018 — Occupational Health and Safety Management Systems

- **Fonte oficial:** https://www.iso.org/standard/63787.html (ISO) e https://www.abntcatalogo.com.br (ABNT NBR ISO 45001:2018, equivalente brasileiro).
- **Revisão vigente:** 2018 (substituiu OHSAS 18001:2007; migração obrigatória até março/2021).
- **Estrutura (High-Level Structure / Annex SL — comum a ISO 9001 e 14001):**
  - Cláusula 4 — **Contexto da organização**: questões internas/externas, partes interessadas, escopo do SGSST, sistema e seus processos.
  - Cláusula 5 — **Liderança e participação dos trabalhadores**: comprometimento da alta direção, política SST, papéis/responsabilidades, **consulta e participação dos trabalhadores** (diferencial frente à 9001).
  - Cláusula 6 — **Planejamento**: identificação de perigos, avaliação de riscos e oportunidades de SST, requisitos legais, objetivos SST e planejamento para alcançá-los.
  - Cláusula 7 — **Apoio**: recursos, competência, conscientização, comunicação, informação documentada.
  - Cláusula 8 — **Operação**: planejamento e controle operacionais, **hierarquia de controles** (alinhada à NIOSH), gestão de mudanças, aquisições/terceirização, preparação e resposta a emergências.
  - Cláusula 9 — **Avaliação de desempenho**: monitoramento/medição, avaliação de conformidade legal, auditoria interna, análise crítica pela direção.
  - Cláusula 10 — **Melhoria**: incidentes, não conformidades, ações corretivas, melhoria contínua.
- **Alinhamento PDCA:** Cláusulas 4-7 = Plan, 8 = Do, 9 = Check, 10 = Act.
- **Certificação no Brasil:** ABNT (publicação da NBR), Inmetro/Cgcre (acreditação dos OCs — Organismos Certificadores). A certificação é feita por terceira parte acreditada (DNV, Bureau Veritas, BSI, TÜV, ABS QE etc.) em ciclo de 3 anos (auditoria de certificação + 2 manutenções).
- **Aplicação no SST Manager:** o sistema já endereça {empresa, riscos, controles, treinamentos, ocorrências, documentos legais}. Gaps típicos para suportar certificação:
  - Trilha auditável de **consulta/participação dos trabalhadores** (cláusula 5.4) — registro formal de CIPA, reuniões e decisões.
  - Módulo de **gestão de mudanças** (8.1.3) e de **aquisições/contratados** (8.1.4) com workflow.
  - **Avaliação de conformidade legal** periódica (9.1.2) — relatório por requisito legal.
  - **Análise crítica pela direção** (9.3) — template estruturado de pauta + atas + decisões com prazos.

### 1.2 ISO 45003:2021 — Psychological health and safety at work

- **Fonte:** https://www.iso.org/standard/64283.html
- **Revisão:** 2021. Primeira norma ISO específica para **saúde psicossocial no trabalho**, como complemento da 45001.
- **Escopo:** orienta o gerenciamento de riscos psicossociais dentro do SGSST: estresse, assédio (moral/sexual), violência no trabalho, sobrecarga, isolamento, demandas emocionais, conflitos interpessoais.
- **Requisitos-chave:**
  - Identificação de **fatores de risco psicossocial** (organização do trabalho, fatores sociais, ambiente/equipamento, eventos críticos).
  - Avaliação e controle aplicando a **hierarquia de controles** adaptada (eliminar exposições, redesenhar processos, controles administrativos, suporte ao indivíduo).
  - **Confidencialidade** dos relatos (relevante para LGPD Art. 11).
  - Indicadores: absenteísmo, turnover, afastamentos por CID-10 capítulo F (transtornos mentais), pesquisas de clima.
- **Aplicação no SST Manager:** correlato à **NR-1 (PGR)** atualizada em maio/2025, que tornou obrigatória a inclusão de **riscos psicossociais** no inventário de riscos. Modelar como subtipo de `Risco` com `categoria = 'psicossocial'` e formulário próprio (escala Copenhagen Psychosocial Questionnaire — COPSOQ — ou similar).

### 1.3 ISO 31000:2018 — Risk management

- **Fonte:** https://www.iso.org/standard/65694.html
- **Revisão:** 2018 (segunda edição).
- **Três blocos:**
  1. **Princípios (8):** integrada, estruturada e abrangente, customizada, inclusiva, dinâmica, melhor informação disponível, fatores humanos e culturais, melhoria contínua.
  2. **Framework:** liderança e comprometimento → integração → projeto → implementação → avaliação → melhoria.
  3. **Processo:** comunicação e consulta ↔ escopo/contexto/critérios → **identificação → análise → avaliação → tratamento** → monitoramento/análise crítica → registro/relato.
- **Integração com ISO 45001:** a 45001 cláusula 6.1 referencia explicitamente a abordagem baseada em risco da 31000; a 31000 é o "como" enquanto a 45001 é o "o quê" para SST.
- **Norma irmã:** ISO/IEC 31010:2019 — Risk assessment techniques (catálogo de 41 técnicas: HAZOP, Bowtie, FMEA, FTA, JSA, Delphi etc.).
- **Aplicação no SST Manager:** alinhar o módulo de Riscos ao processo 31000 — campos para `contexto`, `critérios`, `consequência × probabilidade`, `tratamento` e `monitoramento` com versionamento.

### 1.4 ISO 14001:2015 — Environmental management

- **Fonte:** https://www.iso.org/standard/60857.html
- **Revisão:** 2015 (próxima revisão ISO 14001:2026 em consulta pública).
- **Overlap com SST relevante para a empresa (construção + data centers):**
  - **Aspectos ambientais ≈ perigos SST** em obras (poeira, ruído, vibração, resíduos).
  - **Requisitos legais e outros requisitos** (cláusula 6.1.3) — pode compartilhar matriz com 45001.
  - **Preparação e resposta a emergências** (8.2) — derramamento químico afeta meio ambiente E trabalhadores.
- **Sistemas integrados SGI** (9001 + 14001 + 45001): mesma Annex SL → fácil unificar processos de gestão (auditoria, análise crítica, ações corretivas).

### 1.5 NBRs brasileiras — construção & data centers

| Norma | Título | Revisão | Aplicação a empresa |
|---|---|---|---|
| **NBR 14276** | Brigada de incêndio — Requisitos e procedimentos | 2020 | Plano de emergência em obras e data centers; treinamentos e dimensionamento de brigada. |
| **NBR 9050** | Acessibilidade a edificações, mobiliário, espaços e equipamentos urbanos | 2020 (Emenda 1) | Projeto de obras; também acessibilidade nos próprios canteiros (banheiros, escritórios). |
| **NBR 5410** | Instalações elétricas de baixa tensão | 2004 (em revisão 2026) | Obras prediais e instalações temporárias de canteiro; relaciona à NR-10. |
| **NBR 14039** | Instalações elétricas de média tensão de 1,0 kV a 36,2 kV | 2021 | Subestações de obras grandes e data centers; relaciona à NR-10 e NR-16. |
| **NBR 16001** | Responsabilidade social — Sistema da gestão | 2012 (revisão prevista) | Governança ESG; útil para licitações públicas. |
| **NBR ISO/IEC 27001** | Sistemas de gestão da segurança da informação | 2022 | **Crítico para data centers**: ativos, controles do Anexo A (93 controles na versão 2022). |
| **NBR ISO/IEC 27017 / 27018** | Controles para serviços em nuvem / proteção de PII em nuvem | 2016 | Quando data centers oferecem cloud/colocation. |
| **NBR 16280** | Reforma em edificações | 2020 | Quando obras de reforma envolvem áreas ocupadas. |
| **NBR 7678** | Segurança na execução de obras e serviços de construção | 1983 (antiga, mas ainda referenciada) | Suporte à NR-18. |
| **NBR 6494** | Segurança nos andaimes | 1990 | NR-18 / NR-35 (trabalho em altura). |

**Fonte de consulta:** https://www.abntcatalogo.com.br (catálogo oficial, pago para download da norma completa).

**Aplicação no SST Manager:** criar tabela `normas_tecnicas` linkando NRs a NBRs aplicáveis e cláusulas relevantes, para gerar checklists de conformidade por tipo de obra (residencial / industrial / data center).

### 1.6 NIOSH Hierarchy of Controls

- **Fonte oficial:** https://www.cdc.gov/niosh/topics/hierarchy/ e https://www.cdc.gov/niosh/hierarchy-of-controls/about/index.html
- **Ordem (mais para menos efetiva):**
  1. **Elimination** — remover o perigo (ex: substituir trabalho em altura por execução no solo).
  2. **Substitution** — trocar por algo menos perigoso (ex: solvente à base d'água).
  3. **Engineering controls** — isolar o trabalhador do perigo (guardas, enclausuramento, ventilação local exaustora).
  4. **Administrative controls** — mudar a forma como as pessoas trabalham (procedimentos, rotação, sinalização, treinamento).
  5. **PPE** — equipamento de proteção individual (último recurso).
- **Integração regulatória:** referenciada explicitamente pela ISO 45001 cláusula 8.1.2 e pela **NR-1 (PGR)** atualizada — exige justificativa quando o controle escolhido não é o do topo da hierarquia.
- **Aplicação no SST Manager:** campo obrigatório `nivel_hierarquia_controle` em cada controle de risco; alerta quando todos os controles para um risco são apenas administrativos/EPI sem evidência de avaliação de engenharia.

### 1.7 Heinrich / Bird — teorias de causação de acidentes

- **Heinrich (1931):** pirâmide 1 fatal : 29 graves : 300 quase-acidentes. Hoje considerada simplista (super-relevância de "ato inseguro" do trabalhador, ~88%).
- **Bird (1969):** revisão estatística com base em 1.7M acidentes — 1 grave : 10 leves : 30 danos materiais : 600 quase-acidentes. Reforça que **near-miss reporting** é o principal leading indicator.
- **HSE / atualizações modernas:** críticas à proporção fixa, mas o princípio "investigar near-miss para prevenir fatalidades" permanece consensual.
- **Aplicação no SST Manager:** módulo de **near-miss / quase-acidente** com workflow leve (1 clique para colaborador reportar pelo mobile), e dashboard de razão fatal:grave:leve:near-miss por empresa/obra.

---

## 2. Métodos de análise de risco

> Catálogo abrangente em **ISO/IEC 31010:2019** (https://www.iso.org/standard/72140.html). Resumo das técnicas mais usadas em SST industrial:

### 2.1 Bowtie analysis
- **Forma:** "gravata-borboleta" — evento topo no centro, **ameaças (esquerda)** → **barreiras preventivas** → **evento** → **barreiras mitigatórias** → **consequências (direita)**.
- **Quando usar:** comunicação visual de cenários críticos (incêndio em data center, queda de carga em obra) para stakeholders não-técnicos; integra com investigação de incidentes (cada barreira que falhou).
- **Refs:** CGE Risk Bowtie Methodology, "Bowtie in Risk Management" da CCPS (AIChE).

### 2.2 FMEA — Failure Mode and Effects Analysis
- **Forma:** tabela por componente/processo — modo de falha × efeito × severidade (S) × ocorrência (O) × detecção (D) → **RPN = S × O × D**.
- **Quando usar:** projetos de engenharia (FMEA de projeto / DFMEA) e processos (PFMEA). Em data centers para sistemas HVAC, no-break, detecção/supressão de incêndio.
- **Refs:** AIAG-VDA FMEA Handbook (1ª ed. 2019), MIL-STD-1629A.

### 2.3 HAZOP — Hazard and Operability Study
- **Forma:** estudo guiado por **palavras-guia** (NO, MORE, LESS, AS WELL AS, PART OF, REVERSE, OTHER THAN) aplicadas a parâmetros (fluxo, pressão, temperatura, nível).
- **Quando usar:** plantas de processo, sistemas hidráulicos, instalações com fluidos perigosos. Em data centers: sistemas de refrigeração, supressão por gás (FM-200, Inergen).
- **Refs:** IEC 61882:2016 — Hazard and operability studies (HAZOP studies).

### 2.4 FTA — Fault Tree Analysis
- **Forma:** árvore lógica top-down do evento indesejado → causas raiz, usando portas AND/OR. Permite cálculo quantitativo de probabilidade.
- **Quando usar:** investigação pós-incidente e análise de confiabilidade de sistemas de proteção (SIS, instrumentação de segurança).
- **Refs:** IEC 61025:2006 — Fault tree analysis (FTA).

### 2.5 JSA / AST — Job Safety Analysis / Análise de Segurança do Trabalho
- **Forma:** decompor tarefa em etapas → identificar perigos por etapa → medidas de controle.
- **Quando usar:** **operacional, antes de cada tarefa não-rotineira**. Base do **APR** (Análise Preliminar de Risco) e da PT (Permissão de Trabalho) em obras.
- **Refs:** OSHA 3071 — Job Hazard Analysis.

### 2.6 What-if / Checklist
- **Forma:** brainstorm guiado ("e se…?") + checklist normativo (NR-10, NR-18, NR-35).
- **Quando usar:** análise rápida, complemento de HAZOP/FMEA, treinamento de equipes novas.

### 2.7 LOPA — Layer of Protection Analysis
- **Forma:** semi-quantitativo, complementa HAZOP. Avalia se camadas de proteção independentes (BPCS, alarmes, SIS, alívio mecânico, contenção) reduzem risco ao nível tolerável.
- **Refs:** CCPS LOPA book (2001).

### 2.8 Comparativo rápido

| Técnica | Tipo | Esforço | Quando preferir |
|---|---|---|---|
| JSA/AST | Qualitativo, tarefa | Baixo | Pré-tarefa, obras, manutenção |
| Bowtie | Qualitativo, cenário | Médio | Comunicação executiva, eventos críticos |
| FMEA | Semi-quant., componente | Médio-alto | Projeto/processo, novas instalações |
| HAZOP | Qualitativo, P&ID | Alto | Plantas, sistemas com fluidos |
| FTA | Quantitativo, causa | Alto | Investigação, confiabilidade |
| LOPA | Semi-quant., camadas | Médio | Após HAZOP, justificar SIL |

---

## 3. Arquitetura & escalabilidade do SST Manager

### 3.1 Multi-tenant Postgres — shared schema com RLS

- **Padrão atual do SST Manager:** shared-schema com coluna `empresa_id` em todas as tabelas tenant-aware + função `user_empresa_id()` em policies RLS.
- **Por que é o padrão certo agora:**
  - 1 banco, 1 esquema, 1 set de migrações → simples para Supabase managed.
  - Postgres RLS é nativo e auditado (https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
  - Cross-tenant analytics interno é trivial (queries com role admin que bypassa RLS).
- **Limites práticos / pegadinhas de performance:**
  - **`auth.uid()` chamada por linha** — envolver em sub-select: `using ((select auth.uid()) = user_id)` para evitar re-execução por row. Documentado em https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv.
  - **Indexar** colunas usadas em policies (`empresa_id`, `user_id`); RLS adiciona predicado mas planner só usa se houver índice.
  - **Sub-SELECT em policy** pode criar race conditions — preferir lookup em tabela pequena imutável (https://www.postgresql.org/docs/current/ddl-rowsecurity.html, seção "Caveats").
  - `SECURITY DEFINER` functions para joins complexos cross-table (cache de membership).
  - PK/FK/UNIQUE **sempre bypass RLS** (Postgres docs) — não confiar em RLS para integridade referencial, e nunca expor PK numérica sequencial entre tenants (use UUID v7).
- **Ceiling estimado:**
  - **~1.000 tenants ativos, ~100M linhas em tabelas críticas, p95 < 200ms** com RLS bem indexado e Supabase Pro (compute Large+).
  - Limites duros do Supabase: connection limits por tier (https://supabase.com/docs/guides/platform/compute-add-ons), pool size do Supavisor.
- **Quando migrar para schema-per-tenant (ou DB-per-tenant):**
  - 1 ou 2 tenants enterprise representam >30% do volume → contention de I/O.
  - Requisitos contratuais de **residência de dados** ou **chave de criptografia por tenant** (BYOK).
  - Plano de mudança regulatório (ex: cliente quer auditoria SOC2 do **seu** banco isolado).
  - Compliance LGPD para dados sensíveis (Art. 11) onde isolamento físico simplifica auditoria.
- **Quando migrar para DB-per-tenant:** apenas para enterprise tier; gerir N migrações via tooling (Atlas, Sqitch, Bytebase). **Recomendado:** manter shared+RLS como default e oferecer DB-isolated como **upgrade pago**.
- **Refs:**
  - https://www.postgresql.org/docs/current/ddl-rowsecurity.html
  - https://supabase.com/docs/guides/database/postgres/row-level-security
  - https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
  - https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/

### 3.2 Supabase scalability — pooling, edge functions, storage

- **Connection pooling:**
  - **Supavisor** (substitui pgbouncer no Supabase) — modo `transaction` para serverless (Vercel functions) e `session` para conexões long-lived.
  - Default pool size é função do compute tier. Para Next.js no Vercel sempre usar a **string de conexão com porta 6543 (transaction pool)**, nunca 5432 direto.
  - Prepared statements limitados em modo transaction — usar `?prepared_statements=false` na connection string ou postgres-js no modo "no prepared".
- **Edge Functions (Deno):** boas para webhooks (eSocial async), tarefas leves de transformação, signed URLs com TTL curto. Limite: ~150s execução, 250MB memória. Não usar para PDF generation pesado.
- **Storage tiers:** Supabase Storage S3-compatible com signed URLs. Para documentos SST com retenção de 20 anos: política de **lifecycle** para tier infrequent access após N dias.
- **Quando outgrow Supabase:**
  - Custos de compute Large/XL/2XL não compensam (>$1.5k/mês) vs RDS autogerenciado.
  - Necessidade de extensões Postgres não disponíveis (TimescaleDB managed só em alguns tiers; pgvector OK).
  - Read replicas multi-região (Supabase suporta replicas mas em poucas regiões).
  - Failover RTO < 30s exigido por contrato — preferir Aurora/Cloud SQL com Patroni gerenciado.
- **Estratégia de saída:** desde o início, **nunca usar features proprietárias** do Supabase sem fallback (preferir SQL puro a Supabase Edge Functions quando possível). Use o Supabase JS apenas em camada fina; lógica de negócio em Postgres functions ou serviços Next.js → portável.
- **Refs:**
  - https://supabase.com/docs/guides/platform/performance
  - https://supabase.com/docs/guides/database/connecting-to-postgres
  - https://supabase.com/docs/guides/platform/compute-add-ons

### 3.3 Audit & retention — eventos SST com retenção legal (20 anos)

- **Requisitos brasileiros chave:**
  - **CAT** (Comunicação de Acidente de Trabalho): retenção 10-20 anos (boas práticas: 30 anos por possíveis ações regressivas do INSS).
  - **ASO** (Atestado de Saúde Ocupacional): 20 anos após desligamento (NR-7 / PCMSO).
  - **PPP** (Perfil Profissiográfico Previdenciário): mínimo 20 anos.
  - **PGR**, **LTCAT**, **PCMSO**: histórico completo, mínimo 20 anos.
- **Padrões aplicáveis:**
  - **Event sourcing parcial** para entidades críticas (Ocorrencia, DocumentoSST, ASO, CAT). Estado atual derivado de stream imutável de eventos. Cada evento carrega `empresa_id`, `actor_id`, `timestamp`, `payload`, `signature_hash`.
  - **Append-only audit log** (tabela `audit_log` particionada por mês, com `RLS` permitindo INSERT mas nunca UPDATE/DELETE). Usar trigger genérico `pgaudit` (https://www.pgaudit.org/) ou trigger custom em todas as tabelas.
  - **Soft delete vs archive tables:**
    - **Soft delete (`deleted_at`)** para itens recentes (operacional, undo de 30 dias).
    - **Archive table** (`*_arquivo`) particionada por ano para documentos selados após assinatura/transmissão eSocial — read-only, query infrequente.
    - **Imutabilidade por hash:** ao "selar" um documento (gerar PDF assinado, transmitir eSocial), gravar SHA-256 do conteúdo + assinatura digital + timestamp confiável (RFC 3161 / carimbo de tempo ICP-Brasil) em coluna imutável.
  - **Particionamento:** `PARTITION BY RANGE (criado_em)` em tabelas grandes (audit_log, exposicoes, ocorrencias) — cria 1 partição/mês, retém quentes em SSD e congela frias.
- **Refs:**
  - Martin Fowler — Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
  - Postgres partitioning: https://www.postgresql.org/docs/current/ddl-partitioning.html
  - pgAudit: https://www.pgaudit.org/

### 3.4 eSocial integration architecture

- **Eventos SST relevantes (Leiautes v.S-1.3, NT 06/2026 — fonte: https://www.gov.br/esocial/pt-br/documentacao-tecnica):**
  - **S-2210** — Comunicação de Acidente de Trabalho (CAT).
  - **S-2220** — Monitoramento da Saúde do Trabalhador (ASO).
  - **S-2240** — Condições Ambientais do Trabalho — Agentes Nocivos (substitui o LTCAT).
- **Arquitetura recomendada:**
  - **Outbound queue + worker pattern:**
    1. Evento de negócio (ex: ASO emitido) grava em `eventos_esocial_pendentes` com payload JSON normalizado.
    2. Worker (Vercel cron / serviço Node persistente) puxa, gera XML conforme XSD, assina com certificado A1.
    3. Envia ao WS eSocial, persiste protocolo, agenda polling de retorno.
    4. Quarta etapa: consultar lote, persistir recibo, atualizar estado para `transmitido` ou `rejeitado` (com motivo).
  - **Certificado A1 vs A3:**
    - **A1** (arquivo .pfx, validade 1 ano): obrigatório para uso server-side; armazenar em **Vercel encrypted env** (limite 64KB - OK para A1) ou **AWS KMS / GCP Secret Manager / Vault**. Nunca commitar.
    - **A3** (token/cartão, validade 3 anos): impossível em ambiente serverless puro — exige host físico com leitora. Para SaaS: oferecer A1 como única opção, ou A3 via "agente local" instalado no cliente.
  - **Assinatura XML:** XMLDSig + canonicalization C14N exclusive. Bibliotecas Node: `xml-crypto`, `node-forge`. Para .NET: System.Security.Cryptography.Xml.
  - **Resiliência:**
    - Idempotência por `eventoId` (hash determinístico do payload + empresa + dataEvento).
    - Backoff exponencial em rejeição transitória (WS lento, lote em processamento). Limite máximo de retry = 5 em 24h, depois alerta humano.
    - Dead-letter queue para rejeições estruturais (XML inválido) — humano corrige e re-enfileira.
  - **Message bus:** para volume alto, **Redis Streams** ou **Postgres LISTEN/NOTIFY** + advisory locks são suficientes; só migrar para **SQS/RabbitMQ/Kafka** se precisar de múltiplos consumers e back-pressure complexo.
- **Libs open-source de referência:**
  - **ACBr / ACBrLibESocial** (Delphi, mais completo e mantido — https://projetoacbr.com.br/) — usar como referência de implementação canônica.
  - **esocial4j** (Java, GitHub) — https://github.com/esocial/esocial4j
  - **esocial-jt / esocial-node** (Node.js — qualidade variável; usar como blueprint, não em produção sem auditoria).
  - **nfe.io** e **Migrate** (commercial) — para empresas que preferem terceirizar a integração.
- **Refs:**
  - Manual de Orientação do Desenvolvedor eSocial v.1.15 (gov.br)
  - XSD: https://www.gov.br/esocial/pt-br/documentacao-tecnica
  - Pacote de Comunicação v.1.6 (WS endpoints, protocolos SOAP)

### 3.5 Document generation pipelines (PDF em escala)

- **Cenário típico SST Manager:** geração de PGR, PCMSO, ASO, fichas de EPI, ordens de serviço, livros de inspeção — variam de 1 página a centenas.
- **Padrões:**
  - **Server-side rendering com puppeteer / playwright:** alta fidelidade mas pesado (~300-500MB de RAM); roda mal em Vercel (cold start lento, limite de 250MB bundle Function). Recomenda-se **serviço dedicado** (Fly.io, Render, AWS Fargate) acionado via fila.
  - **react-pdf / @react-pdf/renderer:** leve, sem Chrome, ideal para Vercel functions. Limitações: layout CSS pobre, sem `flex` completo. Bom para fichas simples.
  - **WeasyPrint / wkhtmltopdf:** Python/CLI, qualidade média, deploy via container.
  - **Adobe / Foxit APIs:** pagas, qualidade alta, bom para contratos.
- **Batch vs on-demand:**
  - **On-demand** (usuário clica → PDF em < 5s): react-pdf inline.
  - **Batch** (gerar PGR completo, 200 páginas, com gráficos): job assíncrono → fila → worker → grava em Storage → notifica usuário (e-mail/in-app).
- **Streaming vs signed URL:**
  - **Signed URL** (TTL 5-15 min, S3/Supabase Storage): padrão para downloads grandes; barato (CDN serve), permite resume.
  - **Streaming pela API** (`Content-Type: application/pdf`, `Transfer-Encoding: chunked`): use só para PDFs < 10MB gerados on-demand sem persistência.
- **Imutabilidade & assinatura:** documentos legais (ASO, CAT, ordem de serviço de EPI assinada pelo trabalhador) devem ser **selados após geração** — hash SHA-256 + assinatura digital ICP-Brasil + carimbo de tempo. Guardar PDF original + manifest JSON em bucket imutável (Object Lock no S3, ou bucket Supabase com policy "no DELETE").
- **Refs:**
  - https://pptr.dev/ (puppeteer)
  - https://react-pdf.org/
  - https://vercel.com/docs/functions/runtimes (limites)

### 3.6 The Twelve-Factor App (12factor.net)

> Aplicabilidade ao SST Manager rodando Next.js no Vercel + Supabase.

| Factor | Resumo | Aplicação SST Manager |
|---|---|---|
| I. Codebase | 1 repo por app, muitos deploys | Monorepo OK; preview deploys por PR. |
| II. Dependencies | Declaradas explicitamente (`package.json` lockfile) | pnpm-lock.yaml versionado, renovate bot. |
| III. Config | Em env vars, nunca em código | Vercel env por ambiente (dev/preview/prod); Supabase keys, certificado A1 em secrets. |
| IV. Backing services | Tratados como recursos plugáveis | Supabase = DB, mas abstrair via repository pattern para permitir migração. |
| V. Build, release, run | Estágios separados | Vercel build → immutable deployment → runtime. |
| VI. Processes | Stateless | Vercel Functions são naturally stateless; **nada em /tmp** entre requests. |
| VII. Port binding | Self-contained | Não aplicável a Vercel; aplicar ao worker eSocial se for hospedar à parte. |
| VIII. Concurrency | Scale via process model | Functions horizontal auto-scale; workers eSocial = N processos por fila. |
| IX. Disposability | Start rápido, graceful shutdown | Cold start < 1s; workers tratam SIGTERM (commit em fila, não meio de transação). |
| X. Dev/prod parity | Ambientes similares | Supabase CLI local + migrations versionadas; seed reprodutível. |
| XI. Logs | Como event stream | Vercel logs → drain para Datadog/Logtail; structured JSON. |
| XII. Admin processes | One-off via mesmo código | Scripts em `/scripts/` rodados via `vercel exec` ou CI. |

- **Ref:** https://12factor.net/

### 3.7 Domain-Driven Design para SST

- **Bounded contexts candidatos:**
  1. **Gestão de Empresa & Lotação** — Empresa, EstabelecimentoCNAE, SetorObra.
  2. **Gestão de Pessoas SST** — Colaborador, Cargo, Funcao, Lotacao, ExposicaoAgentes.
  3. **Documentação Legal** — DocumentoSST, PGR, PCMSO, ASO, LTCAT, OrdemServicoEPI.
  4. **Riscos & Controles** — Risco, MedidaControle, AvaliacaoRisco, Inspecao.
  5. **Ocorrências** — Ocorrencia, CAT, NearMiss, Investigacao, AcaoCorretiva.
  6. **Treinamentos & Capacitação** — Treinamento, MatrizCompetencias, Certificado.
  7. **Integrações Externas** — EventoESocial, NotaFiscalEPI, IntegracaoERP.
- **Aggregates típicos:**
  - **Colaborador** (root) → Lotacao, Exames, Treinamentos. Invariantes: 1 lotação ativa, ASO admissional obrigatório antes de iniciar.
  - **PGR** (root) → Inventario de Riscos → Plano de Ação. Invariante: PGR é versionado; assinatura digital seal.
  - **Ocorrencia** (root) → Investigacao → AcoesCorretivas. Invariante: CAT eSocial S-2210 disparada em até 24h se "acidente típico".
- **Refs:**
  - Eric Evans, "Domain-Driven Design" (Blue Book) — leitura canônica.
  - Vaughn Vernon, "Implementing DDD" — prático.
  - https://martinfowler.com/bliki/DDD_Aggregate.html
  - https://martinfowler.com/bliki/BoundedContext.html

### 3.8 LGPD para dados de saúde ocupacional

- **Base legal:** Lei 13.709/2018 (https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm).
- **Art. 5º, II:** dados pessoais sensíveis incluem **dado referente à saúde** → ASO, CAT, atestados, exames complementares, diagnósticos.
- **Art. 11:** tratamento de dado sensível requer:
  - Consentimento específico e destacado (geralmente inaplicável na relação trabalhista por desequilíbrio — usar outras bases), **ou**
  - Hipóteses legais: cumprimento de obrigação legal (NR-7, NR-15, eSocial), proteção da vida, exercício regular de direitos em processo judicial, tutela da saúde (por profissional de saúde).
- **Art. 11 §3º:** dados sensíveis **não podem** ser comunicados ou usados para obtenção de vantagem econômica (proibido vender perfis de saúde dos trabalhadores).
- **Art. 16:** retenção limitada ao cumprimento da finalidade — porém **conflito** com NR-7 (20 anos) e Previdência (até 30 anos). Solução: documentar base legal "obrigação legal" e segregar dados.
- **Padrões técnicos para o SST Manager:**
  - **Encryption at rest:** Supabase usa AES-256 por default (https://supabase.com/docs/guides/platform/security); colunas extra-sensíveis (CID-10 do ASO, diagnósticos) → criptografia adicional aplicativa com `pgcrypto` ou KMS envelope encryption.
  - **Encryption in transit:** TLS 1.2+ obrigatório.
  - **Access control granular:** RLS já segrega por `empresa_id`; adicionar policy por **role** (médico do trabalho vê CID; gestor SST vê apenas "apto/inapto/restrições"; RH/jurídico só metadados).
  - **Logs de acesso a dado sensível** (audit_log com `categoria='acesso_dado_saude'`) — req. Art. 37 LGPD.
  - **DPO / Encarregado:** apontar e expor canal (Art. 41).
  - **Direitos do titular** (Art. 18): portabilidade (export JSON do trabalhador), correção, anonimização — modelar como jobs de longa duração.
  - **Anonymização x pseudonimização:** dados de pesquisa epidemiológica interna → pseudonimizar (hash com salt por estudo); para descarte legal pós-retenção, **anonimizar** (remover quasi-identificadores).
  - **Compartilhamento com terceiros** (médico do trabalho externo, eSocial, INSS): registrar em **Registro de Operações de Tratamento** (Art. 37) com base legal.
- **Refs:**
  - Lei 13.709/2018: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm
  - Guia ANPD sobre dados sensíveis: https://www.gov.br/anpd/pt-br
  - https://supabase.com/docs/guides/platform/security

---

## 4. Resumo executivo — recomendações priorizadas

1. **Permanecer com shared-schema + RLS** como padrão; criar SLA para enterprise tier opcional com schema isolado quando volume justificar.
2. **Indexar agressivamente** colunas RLS (`empresa_id`, `user_id`) e envolver `auth.uid()` em sub-select; medir p95 por query com `pg_stat_statements`.
3. **Implementar audit_log append-only particionado** desde já — barato agora, caro retrofitar.
4. **Tratar eSocial como serviço externo com fila e worker dedicado** (não dentro de request HTTP).
5. **Selar documentos legais** (PDF + hash + carimbo de tempo) imediatamente após emissão para sustentar valor probatório por 20 anos.
6. **Mapear o domínio SST em bounded contexts DDD** antes de crescer para evitar acoplamento monolítico — começar separando "Documentação Legal" e "Integrações Externas" do core operacional.
7. **Adicionar campo `nivel_hierarquia_controle` (NIOSH)** em controles de risco para alinhamento ISO 45001 + NR-1 (PGR psicossocial).
8. **LGPD by design:** segregação por role médico/gestor para dados de saúde, log de acessos, criptografia aplicativa em CID-10.

---

## 5. Referências consolidadas

### Normas
- ISO 45001:2018 — https://www.iso.org/standard/63787.html
- ISO 45003:2021 — https://www.iso.org/standard/64283.html
- ISO 31000:2018 — https://www.iso.org/standard/65694.html
- ISO/IEC 31010:2019 — https://www.iso.org/standard/72140.html
- ISO 14001:2015 — https://www.iso.org/standard/60857.html
- ISO/IEC 27001:2022 — https://www.iso.org/standard/27001
- ABNT catálogo — https://www.abntcatalogo.com.br
- NIOSH Hierarchy of Controls — https://www.cdc.gov/niosh/hierarchy-of-controls/about/index.html
- IEC 61882 (HAZOP), IEC 61025 (FTA) — https://webstore.iec.ch
- OSHA 3071 (JSA) — https://www.osha.gov/Publications/osha3071.html

### Regulação BR
- eSocial — https://www.gov.br/esocial/pt-br/documentacao-tecnica (v.S-1.3, NT 06/2026)
- LGPD (Lei 13.709/2018) — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm
- ANPD — https://www.gov.br/anpd/pt-br
- NRs (Portal Gov) — https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/normas-regulamentadoras

### Arquitetura
- Postgres RLS — https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Postgres partitioning — https://www.postgresql.org/docs/current/ddl-partitioning.html
- pgAudit — https://www.pgaudit.org/
- Supabase RLS — https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase performance — https://supabase.com/docs/guides/platform/performance
- Supabase security — https://supabase.com/docs/guides/platform/security
- Vercel limits — https://vercel.com/docs/limits (consultado: serverless 5min Pro, 64KB env, 250MB bundle)
- 12-Factor — https://12factor.net/
- Martin Fowler DDD — https://martinfowler.com/bliki/DDD_Aggregate.html, https://martinfowler.com/bliki/BoundedContext.html
- Event Sourcing — https://martinfowler.com/eaaDev/EventSourcing.html
- AWS multi-tenant RLS — https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/

### eSocial bibliotecas
- ACBr — https://projetoacbr.com.br/
- esocial4j (Java) — https://github.com/esocial/esocial4j

### Métodos de risco
- CCPS Bowtie & LOPA — https://www.aiche.org/ccps
- AIAG-VDA FMEA Handbook (2019) — https://www.aiag.org/

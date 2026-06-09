# Gap analysis — SST Manager (estado em 2026-05-10)

> Inventário das capacidades atuais do software e gaps detectados frente às obrigações
> de SST brasileiras (NRs, eSocial, ISO 45001, Lei 14.457/22). Este é um documento
> intermediário; síntese final em `docs/referencias-software.md`.

## 1. O que o software JÁ COBRE

### Domínio / Schema (migrations 0001–0011)
| Entidade | Tabela | Campos-chave |
|----------|--------|--------------|
| Empresa (multi-tenant) | `empresas` | tipo (própria/contratante/terceira), `dona_sistema`, `empresa_mae_id` |
| Obra | `obras` | empresa_id, contratante_id, vigência |
| Cargo | `cargos` | cbo, grupo_risco, **riscos_associados** (jsonb), **epis_obrigatorios** (jsonb), **nrs_aplicaveis** (text[]), **exames_obrigatorios** (jsonb) |
| Colaborador | `colaboradores` | tipo_vinculo (CLT/PJ/temp/estágio/terceiro), status, obra_id |
| Exame ocupacional | `exames_medicos` | tipos admissional/periódico/retorno/mudança/demissional, vencimento, ASO# |
| Treinamento | `treinamentos` + `treinamentos_realizados` | NR ref, carga horária, validade, modalidade |
| EPI | `epis` + `epi_entregas` | CA + validade do CA, motivo de entrega |
| Documento SST | `documentos_sst` | tipos: apr, pt, autorizacao_nr10/35/33, pet, ait, os_seguranca, dialogo_seguranca, checklist, relatorio_inspecao |
| Ocorrência | `ocorrencias` | acidente típico/trajeto/doença, quase-acidente, incidente, condição/ato inseguro, desvio, emergência. CAT, dias afastamento |
| Inspeção | `templates_inspecao` + `inspecoes` | respostas jsonb, % conformidade, geolocalização, assinaturas |
| RBAC | `perfis_acesso` + `usuarios` | perfis: admin, tec_seguranca, etc. |
| Audit | `audit_log` (via trigger 0007) | INSERT/UPDATE/DELETE com diff jsonb |
| Jobs queue | `jobs` (0010) | FSM queued→processing→completed/failed, retry, worker claim |
| **NR catalog** | `nr_catalog` (0011 — recém-criado) | 38 NRs vigentes/revogadas |

### Funcionalidades observadas
- **PDFs gerados**: APR, PT, Autorização NR-10/33/35, Certificado de treinamento, DDS, Ficha de EPI cumulativa, OS NR-01 (1 página por colaborador alocado à obra)
- **CAT XML** em `/api/ocorrencias/[id]/cat-xml` — alinhamento parcial com eSocial S-2210
- **OCR Tesseract** client-side para ASOs (`/exames/ocr`)
- **IA classificação de risco** em APR (Claude Haiku 4.5, matriz 5×5, hierarquia de controle)
- **KPIs em `/relatorios/mensal`**: TF, TG, ocorrências por tipo, comparação MoM, % conformidade inspeções, % cobertura de exames/treinamentos
- **Vencimentos consolidados** (view `vw_vencimentos`) para exames + treinamentos + CAs
- **Heatmap de ocorrências** em `/relatorios/heatmap-ocorrencias`
- **Importação em lote** (Excel/CSV) para empresas, cargos, colaboradores, EPIs, exames, treinamentos
- **Offline** via IndexedDB (idb) — sincronização posterior de inspeções
- **Logger estruturado** JSON com redação de PII + correlação por requestId
- **Captura global de erros client** com `navigator.sendBeacon`
- **Fila assíncrona** com Vercel Cron + Postgres `SKIP LOCKED` para batches grandes

### NRs com documentação operacional disponível
| NR | Documento gerado | Status |
|----|------------------|--------|
| NR-01 | OS NR-01 (Ordem de Serviço) por função + obra | ✓ |
| NR-06 | Ficha de EPI cumulativa com Termo de Responsabilidade | ✓ |
| NR-07 | Registro de ASO + vencimentos | ✓ |
| NR-10 | Autorização para serviços em eletricidade | ✓ |
| NR-33 | Autorização para espaços confinados | ✓ |
| NR-35 | Autorização para trabalho em altura | ✓ |
| (geral) | APR (5×5 + hierarquia de controle), PT, DDS | ✓ |

---

## 2. GAPS detectados — por categoria

### A. Documentos exigidos por NR / Lei que NÃO existem
| Gap | Norma de origem | Onde precisaria entrar |
|-----|-----------------|------------------------|
| **PGR** (Programa de Gerenciamento de Riscos) — documento consolidado com Inventário + Plano de Ação | NR-1 (Portaria MTP 1.378/23) | Nova tabela `pgr` (header) + reuso de `cargos.riscos_associados` como inventário + nova `pgr_acoes` (plano de ação 5W2H) |
| **LTCAT** (Laudo Técnico das Condições Ambientais) — base para aposentadoria especial | Lei 8.213/91 + IN INSS | Tabela `ltcat` por obra/setor + medições higiênicas |
| **PPP** (Perfil Profissiográfico Previdenciário) — substituído por eSocial S-2240 | Lei 8.213 + Decreto 3.048 | Gerador `/api/colaboradores/[id]/ppp` consolidando exames + cargo + LTCAT |
| **Mapa de Risco** (gráfico, por setor/obra) | NR-5 (CIPA, item 5.16) | Componente visual sobre planta + persistência em `mapa_risco` |
| **PCMSO documento** (não só registros de ASO) — relatório anual + planejamento | NR-7 | Geração `/api/pcmso/relatorio-anual` agregando exames |
| **Análise de Acidente** estruturada — relatório com 5 Whys + Ishikawa + ações corretivas vinculadas | NR-1 + ABNT NBR 14280 | Expansão de `ocorrencias.investigacao` para tabela `analise_acidente` com FK de ações |
| **Procedimentos de Trabalho Seguro (PTS)** / instruções de trabalho versionadas | ISO 45001 cláusula 7.5 (informação documentada) | Nova tabela `procedimentos` com versionamento + treinamento de conscientização |
| **Brigada de Incêndio** — cadastro de brigadistas + treinamentos NBR 14276 | NR-23 + NBR 14276 | Visão derivada sobre `colaboradores` + flag `brigadista` + treinamento específico |

### B. eSocial — eventos SST
| Evento | Status atual | Gap |
|--------|--------------|-----|
| **S-2210 CAT** | Parcial — XML gerado em `/api/ocorrencias/[id]/cat-xml` | Validar contra XSD oficial; envio automático ao webservice; tratamento de retorno (recibo) |
| **S-2220 ASO** | ❌ Não implementado | Gerar XML por exame; assinatura A1/A3; queue de envio |
| **S-2240 Condições Ambientais** | ❌ Não implementado | Mapear `cargos.riscos_associados` → tags de fatores de risco eSocial; lote periódico |
| **S-2245 Treinamentos** | ❌ Não implementado (evento recente) | A partir de `treinamentos_realizados` |

### C. CIPA + Lei 14.457/2022 (assédio)
| Gap | Origem | Onde |
|-----|--------|------|
| **Processo eleitoral CIPA** (calendário + candidatos + votação) | NR-5 atualizada | Novo módulo `/cipa` |
| **Canal de denúncia de assédio** anônimo | Lei 14.457/22 art. 23 | Nova tabela `denuncias_assedio` com criptografia e access control restrito |
| **Treinamento de assédio** obrigatório a cada 12 meses | Lei 14.457/22 + NR-5 | Treinamento "ASSEDIO-12M" no catálogo + matriz por cargo |
| **Comissão de Prevenção de Assédio** — ata + reuniões | Lei 14.457 | Reuniões registradas em `cipa_atas` |

### D. Indicadores / KPIs
| Gap | Detalhe |
|-----|---------|
| **HHT hardcoded** | `HHT_MENSAL_ESTIMADO = 66_000` em `/relatorios/mensal/page.tsx` linha 17. Deveria ser calculado: `colab_ativos × jornada_mes × dias_uteis` com override por obra/empresa |
| **Fórmulas TF/TG não documentadas** | Conforme **NBR 14280**: TF = (acid_cAfast × 10⁶) / HHT; TG = (dias_perdidos × 10⁶) / HHT. Documentar em `src/lib/utils/relatorio-mensal.ts` |
| **Indicadores leading ausentes** | Sistema só tem lagging (acidentes, dias). Faltam: % DDS realizados/planejados, % inspeções fechadas no prazo, near-miss rate, % treinamentos no prazo, % EPI dentro da validade |
| **TRIR / LTIR / DART** | Não calculados — padrões OSHA usados em multinacionais (data centers internacionais). Útil pra comparação |
| **Custo de acidente** | Tabela `ocorrencias` não tem `custo_estimado` — útil pra justificar investimentos preventivos |
| **Benchmark por setor** | Sem comparação com AEAT/CNAE — útil para dashboards executivos |

### E. ISO 45001 — gaps para certificação (escalabilidade)
| Cláusula 45001 | Gap |
|-----------------|-----|
| 4. Contexto da organização | Sem registro de partes interessadas (stakeholders) |
| 5. Liderança e participação | Sem registro de análise crítica pela direção |
| 6.1 Planejamento (riscos+oportunidades) | Riscos cobertos via `cargos.riscos_associados`; **oportunidades** não modeladas |
| 6.2 Objetivos SST | Sem tabela de objetivos/metas com acompanhamento |
| 7.5 Informação documentada | Sem versionamento de procedimentos/políticas |
| 8.1 Controles operacionais | Documentos existem, mas sem ligação a procedimentos versionados |
| 9.1 Monitoramento, medição, análise | Parcialmente coberto via relatórios mensais |
| 9.2 Auditoria interna | ❌ Sem módulo |
| 9.3 Análise crítica pela direção | ❌ Sem módulo |
| 10. Melhoria contínua / não conformidades | `ocorrencias.acoes_corretivas` é jsonb solto — sem tabela dedicada de NC/ação com responsável + prazo + verificação de eficácia |

### F. LGPD / dados sensíveis
| Gap |
|-----|
| Política de retenção explícita para dados de saúde (ASO 20 anos, treinamentos 5 anos após desligamento) — falta automação de purga |
| Consentimento expresso para tratamento de dados de saúde (Art. 11 LGPD) — não vejo campo em `colaboradores` |
| Anonimização de relatórios estatísticos que saem do sistema (export Excel) — só RLS interna; export não anonimiza |
| Trilha de acesso a dados sensíveis — `audit_log` cobre escrita, **não cobre leitura/SELECT** |

### G. Arquitetura — preparação para escala
| Tópico | Estado | Recomendação |
|--------|--------|--------------|
| Multi-tenant | Shared-schema + RLS | Funciona até ~5k tenants em Supabase; documentar threshold |
| Connection pooling | Supabase pgbouncer default | Validar com carga real |
| Storage de PDFs gerados | Bucket `job-results` (50MB, zip/pdf) | Implementar política de retenção e tiering pra arquivos > 1 ano |
| eSocial integration | Apenas geração de XML, sem envio | Webservice SEFAZ exige certificado A1/A3 + assinatura XMLDSig + retry queue |
| Audit log retention | Sem TTL | Definir retenção (5 anos? 10?) e arquivamento |
| Backups | Supabase managed | Documentar RTO/RPO + teste de restore |
| Observabilidade | Logger estruturado + Vercel Logs | Faltam alertas (Sentry / Logflare); SLOs definidos |

### H. Outras melhorias notadas no código
| Detalhe | Local | Severidade |
|---------|-------|-----------|
| `HHT_MENSAL_ESTIMADO = 66_000` hardcoded | `relatorios/mensal/page.tsx:17` | Médio (afeta TF/TG) |
| 10 vulnerabilidades npm audit reportadas após upgrade do SDK | `package-lock.json` | Médio |
| eslint 8.57 deprecated, glob 10.3 deprecated | `package.json` (devDeps) | Baixo |
| `ocorrencias.causa_raiz TEXT` é texto livre | `0001_core_schema.sql:211` | Alto (causa raiz estruturada é exigência ISO 45001) |

---

## 3. Prioridades sugeridas (próximas fases pós-Fase 4)

Em ordem de **ROI × esforço** para o contexto da empresa:

1. **PGR completo** (NR-1 + Portaria 1.378/23) — alta exigência fiscal, baixo esforço (reuso de cargos.riscos_associados)
2. **CIPA + Lei 14.457** — alta exigência legal recente, sem cobertura
3. **HHT calculado + indicadores leading** — corrige métricas atuais, baixo esforço
4. **Análise de acidente estruturada** (5 Whys + Ishikawa + NC/ação dedicada) — base para ISO 45001 e melhor que `causa_raiz` texto livre
5. **eSocial S-2220/S-2240/S-2245** — escalabilidade regulatória, esforço alto (XML signing + retry queue)
6. **Auditoria interna + análise crítica** (ISO 45001 9.2/9.3) — preparação para certificação
7. **Mapa de risco visual** — feature de alto impacto demonstrativo
8. **PPP gerador** — diferencial competitivo (pouco automatizado no mercado)

---

## 4. Fora de escopo deste documento
- Pricing/comercial
- UX/design system (separado de compliance)
- DevOps/CI (não toca regulamentação)

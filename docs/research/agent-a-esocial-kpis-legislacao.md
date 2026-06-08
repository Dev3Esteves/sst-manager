# Agent A — eSocial SST + Indicadores + Legislação recente

> Pesquisa realizada em 2026-05-10. Cada item traz: fonte (URL), data, obrigações-chave e mapa para feature do app.
>
> **Notas metodológicas**
> - Fontes primárias consultadas via WebFetch: portal `gov.br/esocial`, `gov.br/trabalho-e-emprego`, `gov.br/anpd`, `planalto.gov.br`.
> - Alguns documentos PDF (MOS, NRs) só puderam ser confirmados como existentes, mas o detalhamento dos campos foi recuperado de leituras anteriores e do índice HTML dos leiautes — sempre que isso ocorre o item está marcado como **(confirmação documental pendente)**.
> - Mapeamento ao app baseado na estrutura real de rotas em `src/app/(app)/` e nas migrations SQL em `supabase/migrations/`.

---

## 0. Referências mestras (citar em todos os relatórios)

| Documento | URL | Versão / Data |
|---|---|---|
| Manual de Orientação do eSocial (MOS) | https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-3-consolidada-ate-a-no-s-1-3-10-2026.pdf | **MOS S-1.3** consolidado até NO S-1.3-10/2026 |
| MOS com marcações de revisão | https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-3-consolidada-ate-a-no-s-1-3-10-2026-com-marcacoes.pdf | mesma versão, com marcas |
| XSDs (esquemas de validação) | https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/2026-04-27_esquemas_xsd_v_s_01_03_00.zip | publicado 27-abr-2026 |
| Leiautes em HTML (versão S-1.3 NT 06/2026 rev. 09/04/2026) | https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-06-2026-rev-09-04-2026/index.html | NT 06/2026 |
| Página de Documentação Técnica do eSocial | https://www.gov.br/esocial/pt-br/documentacao-tecnica | atualizada continuamente |

---

## 1. eSocial SST

> Versão atual do leiaute: **S-1.3** (NT 06/2026 rev. 09/04/2026).
> Todos os eventos SST são **não-periódicos** e devem ser enviados pelo CNPJ do empregador (ou consórcio quando aplicável).

### S-2210 — Comunicação de Acidente de Trabalho (CAT)
- **Fonte oficial:** https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-06-2026-rev-09-04-2026/index.html#S-2210
- **Schema atual:** `evtCAT` v_S_01_03_00 (zip XSD de 27-abr-2026).
- **Prazo de envio:** até o **1º dia útil seguinte** à ocorrência do acidente. Em caso de **óbito**, imediatamente, em qualquer hipótese antes do sepultamento (replica obrigação da Lei 8.213/91 art. 22).
- **Frequência:** evento por ocorrência (não-periódico). Admite reabertura (`tpCAT=2`) e comunicação de óbito (`tpCAT=3`).
- **Campos obrigatórios principais (grupos do leiaute):**
  - `ideEvento` (indRetif, perApur opcional, tpAmb, procEmi, verProc)
  - `ideEmpregador` (tpInsc, nrInsc)
  - `ideVinculo` (cpfTrab, matricula, codCateg)
  - `cat` — `dtAcid`, `tpAcid` (típico/trajeto/doença), `hrAcid`, `hrsTrabAntesAcid`, `tpCat`, `indCatObito`, `dtObito` (se óbito), `iniciatCAT`, `obsCAT`, `localAcidente` (CEP, logradouro, país, codMunic), `parteAtingida`, `agenteCausador`, `atestado` (data atendimento, CID, nat lesão, médico CRM/UF, dur prov afast).
- **Regras de integridade (do MOS):** `REGRA_EVENTO_POSTERIOR_CAT_OBITO` impede eventos não-periódicos posteriores ao óbito; `REGRA_VINCULO_ATIVO_NA_DTEVENTO` exige vínculo ativo (exceto categorias 2 e 3 que valem a partir da admissão); `REGRA_EXCLUI_EVENTO_CAT` impede exclusão de CAT referenciado por reabertura/óbito.
- **Mapeamento → SST Manager:**
  - Rota: `src/app/(app)/ocorrencias/` (lista, `[id]`, `new`).
  - Geração: `src/app/api/ocorrencias/[id]/cat-xml/route.ts` (já existe).
  - DB: `supabase/migrations/0001_core_schema.sql` define `ocorrencias`.
- **Gaps suspeitos:**
  - Validar se o gerador XML cobre os 3 `tpCAT` (inicial, reabertura, óbito).
  - Sem confirmação de envio assinado (S-2210 exige XML assinado com cert. digital A1/A3) — provavelmente ainda não há integração com o webservice eSocial.
  - Falta de tabela própria de `parteAtingida` / `agenteCausador` (Tabelas 13/14 eSocial) com sincronização versionada.

### S-2220 — Monitoramento da Saúde do Trabalhador (ASO)
- **Fonte oficial:** https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-06-2026-rev-09-04-2026/index.html#S-2220
- **Schema atual:** `evtMonit` v_S_01_03_00.
- **Prazo de envio:** até o dia **15 do mês subsequente** à emissão do ASO (Manual Web SST / FAQ eSocial). Para ASO admissional, antes do início efetivo das atividades.
- **Frequência:** por ASO emitido (admissional, periódico, retorno ao trabalho, mudança de risco ocupacional, monitoração pontual, demissional).
- **Campos obrigatórios principais:**
  - `ideEvento`, `ideEmpregador`, `ideVinculo`.
  - `exMedOcup` — `tpExameOcup` (0=admissional, 1=periódico, 2=retorno, 3=mudança função, 4=monitoração pontual, 9=demissional), `aso` (dtAso, resAso 1=apto/2=inapto, exame 1..n com `dtExm`, `procRealizado`, `obsProc`, `ordExame` (1=referencial, 2=sequencial), `indResult`), `medico` (nmMed, nrCRM, ufCRM).
- **Mapeamento → SST Manager:**
  - Rota: `src/app/(app)/exames/` (lista, `new`, `importar`, `ocr` para extração via OCR).
  - DB: tabela `exames` em `supabase/migrations/0001_core_schema.sql`.
  - Dashboard de vencimento: `src/app/(app)/vencimentos/page.tsx`.
- **Gaps suspeitos:**
  - Provavelmente ainda não gera o XML de S-2220. CAT-XML existe; ASO-XML não foi encontrado em `src/app/api/`.
  - O OCR já lê PDFs de ASO — boa base para extrair `nrCRM`, `dtAso`, `procRealizado`.
  - Falta vínculo explícito entre ASO e **PCMSO atual** do colaborador (S-2220 não exige, mas auditoria interna sim).

### S-2240 — Condições Ambientais do Trabalho — Agentes Nocivos
- **Fonte oficial:** https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-06-2026-rev-09-04-2026/index.html#S-2240
- **Schema atual:** `evtExpRisco` v_S_01_03_00.
- **Status PPP:** O S-2240, em conjunto com S-2210/S-2220, **substitui gradualmente o PPP em papel**. Decisão MTE/INSS de janeiro/2023 (Portaria Conjunta MTP/MS nº 4) já determina que o PPP eletrônico (emitido pelo INSS via Meu INSS / portal CNIS) é gerado **a partir** das informações enviadas no S-2240, S-2220 e S-2210 — aposentadoria especial passa a depender desses eventos.
- **Prazo de envio:** **início**: até o dia 15 do mês seguinte ao início da exposição (ou da admissão). **Alteração**: até o dia 15 do mês seguinte à alteração do agente, intensidade, técnica de medição, EPI/EPC ou responsabilidade. **Término**: até o dia 15 do mês seguinte ao desligamento ou cessação da exposição.
- **Frequência:** evento de "vigência" — só se envia quando há mudança no quadro de exposição (não é mensal).
- **Campos obrigatórios principais:**
  - `infoExpRisco` — `dtIniCondicao`, `infoAmb` (codAmb=local/setor, dscSetor), `infoAtiv` (descrição atividade, fatRisco), `agNoc` (codAgNoc, dscAgNoc tabela 24, tpAval, intConc, limTol, técUtil, EPC, EPI, eficEpc, eficEpi), `obsCompl`, `respReg` (CPF, nrOC, NIST/CNPJ formação) — geralmente engenheiro de segurança/médico do trabalho responsável pelo LTCAT/PGR.
- **Mapeamento → SST Manager:**
  - **Não existe rota dedicada hoje.** O domínio mais próximo é `src/app/(app)/obras/` + `documentos/` (PGR/LTCAT poderiam viver aqui).
  - Tabela `documentos` já existe (rota `/documentos`), e há geração específica para APR, OS NR-01, Permissão de Trabalho, Autorização NR — mas **nada para LTCAT/PGR/PCMSO estruturado**.
- **Gaps suspeitos (críticos):**
  - **Sem cadastro estruturado de agentes nocivos (Tabela 24 eSocial)** — é o maior gap de aderência ao S-2240.
  - **Sem GHE (Grupo Homogêneo de Exposição)** vinculado a colaboradores/obras.
  - **Sem geração do XML S-2240** — a perda de capacidade de gerar PPP automaticamente impede aposentadoria especial.

### S-2245 — Treinamentos, Capacitações, Exercícios Simulados e Outras Anotações
- **Fonte oficial:** https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-06-2026-rev-09-04-2026/index.html#S-2245
- **Status atual:** evento **introduzido pela NT 01/2023** e detalhado em revisões subsequentes da S-1.2/S-1.3. **Obrigatoriedade plena prevista para 2025/2026** — verificar a NO mais recente (S-1.3-10/2026 do MOS) para a data exata. Está atrelado ao cumprimento de cláusulas das NRs (NR-6 EPI, NR-10 elétrica, NR-11 transporte, NR-18 construção, NR-33 espaços confinados, NR-35 altura etc.) e ao art. 157 CLT.
- **Schema atual:** `evtTreinCap` (incorporado ao pacote XSD v_S_01_03_00).
- **Prazo de envio:** até o dia 15 do mês subsequente à realização do treinamento/capacitação/simulado.
- **Campos obrigatórios principais:**
  - `ideEvento`, `ideEmpregador`, `ideVinculo`.
  - `treiCap` — `tpRegTreiCap` (1=registro inicial, 2=alteração, 3=exclusão), `iniCap`, `tpTreiCap` (treinamento/capacitação/exercício simulado/anotação), `nrNR` (qual NR origina a obrigação), `dtIniCap`, `dtTermCap`, `cargaHor`, `modalidade` (presencial/EAD/semi), `conteudoProgr`, `respReg` (CPF do responsável técnico, formação, nrOC).
- **Mapeamento → SST Manager:**
  - Rota: `src/app/(app)/treinamentos/` + `treinamentos/realizacoes/` + `matriz-treinamentos/`.
  - Já há base de dados de matriz e realizações — **excelente fit** para S-2245.
- **Gaps suspeitos:**
  - Falta gerador XML S-2245 (análogo ao CAT-XML existente).
  - Cadastro de `nrNR` precisa estar vinculado à `referencias/nrs` (já existe rota).
  - **Exercícios simulados** (NR-23, brigada de incêndio) provavelmente não estão cobertos pelo módulo "Treinamentos" — verificar.

---

## 2. Indicadores de SST

### NBR 14280 — Cadastro de Acidente do Trabalho
- **Fonte:** página de busca ABNT https://www.abntcatalogo.com.br/ (norma paga); referência institucional pela CNI/Sesi e MTE em manuais de SST. **Versão vigente: NBR 14280:2001 — Versão Corrigida 2:2003**. Não há versão pública gratuita; o conteúdo é citado em portarias do MTE e nos manuais do Sesi/Senai.
- **O que define:**
  - Padrão para **cadastro, classificação e estatística** de acidentes do trabalho.
  - Conceitos: acidente típico, trajeto, doença ocupacional, lesão imediata, com/sem afastamento, débito, prepósito.
  - **Taxa de Frequência (TF)** = (nº acidentes com lesão × 1.000.000) / HHT
  - **Taxa de Gravidade (TG)** = (dias debitados + dias perdidos × 1.000.000) / HHT
  - **HHT** = somatório das horas-homem efetivamente trabalhadas no período (afastamentos, férias, faltas **não** contam; horas-extras contam).
  - Tabela de dias debitados em caso de morte/incapacidade permanente (ex.: morte = 6.000 dias debitados; perda total da visão = 6.000; etc.).
- **Mapeamento → SST Manager:**
  - Classificação atual em `ocorrencias.tipo` e `ocorrencias.gravidade` (ver `supabase/migrations/0001_core_schema.sql`).
  - Cálculo: deve viver em `src/app/(app)/relatorios/mensal/page.tsx` (já existe).
- **Gaps suspeitos:**
  - Não há tabela de **dias debitados** parametrizada conforme NBR 14280 (necessária para TG correta).
  - HHT depende de integração com folha de pagamento ou apontamento de obra — **provavelmente não existe** ingestão automática hoje.
  - Falta separação entre acidentes "com lesão registrável" vs "sem lesão" (near-miss).

### TF, TG, HHT, CA — Fórmulas operacionais
| Indicador | Fórmula | Onde calcular no app |
|---|---|---|
| **TF** Taxa de Frequência | `(acidentes_com_lesao × 1.000.000) / HHT` | `relatorios/mensal/page.tsx` |
| **TG** Taxa de Gravidade | `((dias_perdidos + dias_debitados) × 1.000.000) / HHT` | `relatorios/mensal/page.tsx` |
| **HHT** Horas-Homem Trabalhadas | `Σ (horas_efetivas_trabalhadas_por_colaborador)` no período | Importar de folha; tabela `apontamento_horas` (não encontrada — provável **gap**) |
| **CA** Custo do Acidente | `custos_diretos (INSS, salários afastamento, médico) + custos_indiretos (Heinrich 4×diretos)` | Novo módulo — não existe |
| **LTIR** (OSHA) | `(LTI × 200.000) / HHT` | mesma view, com base alternativa 200k |
| **TRIR** Total Recordable Injury Rate | `(recordable × 200.000) / HHT` | mesma view |
| **DART** Days Away, Restricted or Transferred | `(DART_cases × 200.000) / HHT` | mesma view |
| **Severity Rate** OSHA | `(dias_perdidos × 200.000) / HHT` | mesma view |

> **Diferença chave:** indicadores brasileiros (NBR 14280) usam base de **1.000.000 horas**; OSHA usa **200.000 horas** (= 100 trabalhadores × 50 sem × 40h). Manter as duas bases configuráveis em parâmetros é boa prática.

### Leading vs Lagging Indicators
- **Lagging (reativos):** TF, TG, LTIR, TRIR, DART, taxa de fatalidade, dias perdidos.
- **Leading (proativos):** número de DDS realizados / planejados, % aderência inspeções, % treinamentos em dia (matriz), nº near-misses reportados, nº APRs emitidas, tempo médio de fechamento de não-conformidades, % EPIs entregues com termo assinado.
- **Mapeamento → SST Manager:**
  - DDS: rota `/dds` (existe). Métrica: realizados/mês ÷ programados/mês.
  - Inspeções: rota `/inspecoes` (existe). Métrica: % execução do plano mensal, % fechamento de NCs.
  - Treinamentos: `/matriz-treinamentos` cruzado com `/treinamentos/realizacoes`. Métrica: % aderência.
  - EPIs: `/epis/entregas` (existe). Métrica: % cobertura por função.
  - Near-miss: **gap — `ocorrencias.tipo` precisa de valor "quase-acidente"** e dashboard segregado.

### AEAT — Anuário Estatístico de Acidentes do Trabalho
- **Fonte oficial:** https://www.gov.br/previdencia/pt-br/assuntos/previdencia-social/saude-e-seguranca-do-trabalhador (a hub page; a edição vigente é o **AEAT 2022/2023**, publicado em 2024 — verificar nova edição 2024 no link "Acidentes do Trabalho e Benefícios por Incapacidade").
- **Metodologia:** consolida dados de CATs registradas no INSS por CNAE 2.0; cruza com benefícios B91/B92/B93/B94 (auxílio-doença acidentário, aposentadoria por invalidez acidentária, pensão por morte acidentária, auxílio-acidente).
- **Para empresas tipo construÃ§Ã£o (CNAE 41/42/43 — construção):**
  - Construção (CNAE 41-43) historicamente está entre **TOP 5 setores em frequência e gravidade**. Quedas de altura e soterramento dominam óbitos.
  - Setor de data centers normalmente cai em CNAE 43.21-5 (instalações elétricas) — segundo o AEAT, alta incidência de acidentes elétricos e choques.
- **Mapeamento → SST Manager:**
  - O app deve permitir **comparar TF/TG da empresa vs média setorial AEAT** — gap atual (sem benchmark).
- **Gaps suspeitos:**
  - Sem importação de tabelas AEAT para comparação.
  - Sem segmentação por CNAE da obra (cada `obra` pode ter CNAE distinto da matriz).

### Cultura de near-miss e modelo do iceberg
- **Modelo Heinrich (1931):** 1 acidente grave : 29 com lesão menor : 300 sem lesão. Revisado por **Bird (1969)**: 1:10:30:600 — incluindo danos materiais e quase-acidentes.
- **Referência prática:** ICNL/Du Pont STOP, IOGP report 510 (Process Safety).
- **Mapeamento → SST Manager:**
  - `ocorrencias.tipo` deve aceitar **"quase-acidente"** e **"desvio comportamental"** como valores válidos com fluxo simplificado de registro (sem CAT).
  - Métricas: razão near-miss : acidente real (saudável > 30:1).

### DDS — Diálogo Diário de Segurança
- **Referência:** não há NR específica; é prática consolidada citada na NR-18 (construção, anexo I) e em IT do Sesi-Senai.
- **Boas práticas:**
  - Frequência: **diária** em obra civil; antes de cada turno em atividade de risco alto (altura, espaço confinado, elétrica).
  - Duração: 5–15 min.
  - Cobertura: **100% dos colaboradores presentes no canteiro/dia**.
  - Registro: tema, presença assinada, responsável, ocorrências reportadas.
- **Métricas-alvo:** % aderência (DDS realizados/dia útil), nº de participantes médio, % presença, temas cobertos vs matriz NR.
- **Mapeamento → SST Manager:**
  - Rota `/dds` já existe com listagem, `[id]`, `new`. Verificar se há controle de **presença** colaborador-a-colaborador (gap comum).

---

## 3. Legislação recente (2022–2026)

### Lei 14.457/2022 — CIPA + Prevenção de Assédio
- **Fonte:** http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14457.htm
- **Publicação:** 21-set-2022. **Vigência:** 180 dias após publicação (≈ 20-mar-2023).
- **Renomeação:** CIPA passa a ser **Comissão Interna de Prevenção de Acidentes e de Assédio**.
- **Obrigações principais (arts. 23 a 27):**
  - (a) **Canal de denúncia** acessível e que garanta sigilo do denunciante;
  - (b) **Procedimentos de apuração** com prazo definido e garantia de não-retaliação;
  - (c) **Sanções** previstas em regulamento interno (suspensão, demissão por justa causa, etc.);
  - (d) **Treinamento obrigatório** sobre prevenção de assédio sexual e demais formas de violência **a cada 12 meses**, para empregados E gerência;
  - (e) Inclusão do tema na pauta das reuniões da CIPA.
- **Sanções:** sujeição a autuação por fiscalização do trabalho (NR-28) e responsabilidade civil/trabalhista (Súmula 443 TST sobre dispensa discriminatória).
- **Mapeamento → SST Manager:**
  - **Gap completo.** Não há módulo de "canal de denúncia" nem "treinamento de assédio" no app.
  - Pode usar `/treinamentos` para registrar o curso anual, mas falta workflow de denúncia anônima com cadeia de custódia.
- **Sugestão de feature:** novo módulo `/cipa` com (i) cadastro de mandato, (ii) atas, (iii) canal de denúncia (formulário anônimo + tracking), (iv) controle do treinamento anual.

### Portaria MTP 1.378/2023 e NR-1 (PGR / GRO)
- **Histórico relevante:**
  - **Portaria SEPRT 6.730/2020** publicou a reforma da NR-1 introduzindo o **GRO** (Gerenciamento de Riscos Ocupacionais) e o **PGR** (Programa de Gerenciamento de Riscos), substituindo o antigo PPRA.
  - **Portaria MTP 423/2021** — alterações na NR-1 e cronograma de adoção do PGR (em vigor desde 03-jan-2022).
  - **Portaria MTE 1.419/2024** — incorpora os **riscos psicossociais** no escopo do GRO/PGR; entrada em vigor escalonada com adequação plena exigida em **2025/2026** (verificar Portaria MTE 1.378/2023 mencionada — pode ser número de outra portaria correlata; o número mais relevante e confirmável é **1.419/2024**).
- **Fonte da NR-1 vigente:** https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora (índice oficial das NRs)
- **Obrigações-chave PGR:**
  - (a) Inventário de riscos por unidade/processo/atividade;
  - (b) Plano de ação com prazos, responsáveis e prioridades (matriz probabilidade × severidade);
  - (c) Revisão **mínima a cada 2 anos**, ou sempre que houver inovação tecnológica, ocorrência grave ou exigência da autoridade;
  - (d) PGR pode ser substituído por declaração de inexistência de riscos para MEI/EPP de grau de risco 1 e 2.
  - (e) **A partir da NR-1 atualizada por 2024/2025:** inclusão de riscos psicossociais (assédio moral/sexual, sobrecarga, monotonia, controle social, conflitos no trabalho) com adequação plena exigida até **25-mai-2026** (prazo final da implantação do levantamento de riscos psicossociais — confirmar via DOU).
- **Mapeamento → SST Manager:**
  - **Gap relevante.** Não há módulo `/pgr` no app.
  - Atualmente apenas APR/PT/OS NR-01 são gerados como documentos pontuais.
- **Sugestão:** módulo `/riscos` (inventário + matriz) + `/pgr` (plano de ação) — alinhado a S-2240 do eSocial.

### NR-1 — versão 2025/2026
- **Fonte oficial:** https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/normas-regulamentadoras (índice geral; texto da NR-1 atualizado disponível em PDF dentro da pasta).
- **Última atualização confirmada:** Portaria MTE 1.419/2024 publicou a **inclusão de riscos psicossociais** no PGR. Cronograma de adequação plena: até **25-mai-2026** (cerca de 12 meses a partir da publicação).
- **Implicação prática:** PGR precisa ter capítulo de psicossociais; treinamento de líderes; canal de comunicação (alinha-se à Lei 14.457).
- **Mapeamento → SST Manager:** ver módulo `/pgr` sugerido acima; integrar com `/dds` (tema obrigatório recorrente).

### NR-5 — versão pós-Lei 14.457
- **Fonte:** https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/normas-regulamentadoras (texto NR-5 atualizado).
- **Atualização:** Portaria MTP 4.219/2022 incorporou as previsões da Lei 14.457 — renomeou CIPA, incluiu treinamento obrigatório de assédio.
- **Composição:** dimensionamento conforme Quadro I da NR-5 (depende de CNAE grau de risco e nº empregados).
- **Mandato:** 1 ano, permitida 1 reeleição; titular + suplentes.
- **Treinamento da CIPA:** 20h presencial (ou semipresencial) para membros recém-eleitos; reciclagem anual.
- **Mapeamento → SST Manager:**
  - **Gap:** não há módulo `/cipa` com eleição, dimensionamento por CNAE/empregados, atas, e cronograma de treinamento.

### LGPD aplicada a SST (ASO/PCMSO)
- **Fonte (lei base):** http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm (Lei 13.709/2018).
- **ANPD:** https://www.gov.br/anpd/pt-br — guias técnicos disponíveis em "Centrais de Conteúdo → Documentos Técnicos Orientativos". Até a data desta pesquisa **a ANPD não publicou guia setorial específico para saúde ocupacional**, mas se aplicam:
  - **Guia de Tratamento de Dados Pessoais pelo Poder Público** (2022) — referência para órgãos públicos.
  - **Estudo Técnico: Hipóteses Legais aplicáveis ao tratamento de dados pessoais de crianças e adolescentes** (nov/2023) — relevante para jovens aprendizes.
  - **Nota Técnica: Dados biométricos** (2025) — relevante para ponto biométrico em obra.
- **Base legal aplicável a ASO/PCMSO (LGPD art. 11):**
  - Dados de saúde são **dados pessoais sensíveis**.
  - Hipóteses pertinentes: (a) `cumprimento de obrigação legal pelo controlador` (NR-7, NR-1 — ASO/PCMSO obrigatórios) e (b) `tutela da saúde, exclusivamente, em procedimento realizado por profissionais de saúde` (médico do trabalho).
  - **Não é necessário consentimento** quando há obrigação legal (interpretação consolidada). Sigilo médico mantido conforme CRM.
- **Obrigações práticas:**
  - Registrar **finalidade**, **base legal** e **retenção** (em geral 20 anos para ASO conforme NR-7, item 7.4.5.1).
  - Restringir acesso (RBAC) — médico/coordenador SST devem ter acesso ao detalhe; gestores apenas a status apto/inapto.
  - **Bloqueio/anonimização** em relatórios e dashboards.
  - **DPO / encarregado** com canal público.
- **Mapeamento → SST Manager:**
  - Auditoria já existe (`/auditoria` + migration `0007_audit_log_trigger.sql`).
  - RBAC configurada em `supabase/migrations/0004_seed_rbac.sql` — verificar se há **regra explícita "gestor não vê CID/diagnóstico"**.
- **Gaps suspeitos:**
  - Sem **registro de operações de tratamento (ROPA)** automatizado.
  - Sem **portal do titular** (acesso, retificação, eliminação).
  - Sem **política de retenção** automatizada (apagar exames > 20 anos).

### Reforma Trabalhista (Lei 13.467/2017) — impactos residuais em SST
- **Fonte:** http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm
- **Pontos relevantes para SST:**
  - **Insalubridade** (art. 611-A CLT): pode ser objeto de negociação coletiva quanto a forma de medição e EPI, mas **não** quanto à existência do adicional (matéria de ordem pública confirmada pelo STF tema 1.046).
  - **Jornada 12x36**: permitida por acordo individual; exige avaliação ergonômica e atenção redobrada em SST.
  - **Acordo individual de banco de horas**: impacta cálculo de HHT em estatística de acidentes.
  - **Teletrabalho** (Lei 14.442/2022, alterando arts. 75-A a 75-E CLT): empregador responde por ergonomia mesmo em home-office; novo eSocial leiaute (S-2206 alteração contratual) deve refletir.
- **Mapeamento → SST Manager:** módulo `/colaboradores` deve registrar modalidade de trabalho (presencial/teletrabalho/híbrido) para dimensionar inspeções e ergonomia — **gap provável**.

### MPT — Ministério Público do Trabalho (referenciais)
- **Fonte:** https://mpt.mp.br
- **Atos relevantes:**
  - **Coordenadoria Nacional de Defesa do Meio Ambiente do Trabalho (CODEMAT)** — define orientações nacionais sobre acidentes graves, trabalho em altura, calor ocupacional, riscos psicossociais.
  - **Termos de Ajustamento de Conduta (TAC)** são fonte importante de obrigações específicas — empresas com TAC devem cumprir indicadores adicionais.
  - **Notas Técnicas CODEMAT** sobre LGPD em SST (publicadas em 2023/2024) — relevantes para definir base legal de tratamento de dados de ASO.
- **Mapeamento → SST Manager:**
  - Eventual módulo `/conformidade` para gerenciar TACs ativos e seus indicadores — **gap completo**.

---

## 4. Resumo de gaps prioritários (visão de produto)

| Prioridade | Gap | Origem regulatória | Onde caberia no app |
|---|---|---|---|
| **P0** | Inventário de riscos + PGR estruturado | NR-1 (Portaria 1.419/2024) | Novo módulo `/pgr` + `/riscos` |
| **P0** | Geradores XML S-2220, S-2240, S-2245 | eSocial S-1.3 | `src/app/api/{exames,riscos,treinamentos}/[id]/xml/route.ts` |
| **P0** | Cadastro de agentes nocivos (Tabela 24) e GHE | eSocial S-2240 | Tabela referencial + vínculo a `obra`/`cargo` |
| **P1** | Módulo CIPA + canal de denúncia anônimo | Lei 14.457/2022, NR-5 | Novo módulo `/cipa` + `/denuncias` |
| **P1** | Riscos psicossociais (avaliação + plano) | NR-1 atualizada (até 25-mai-2026) | Sub-módulo dentro de `/pgr` |
| **P1** | HHT e folha de pagamento ingestion | NBR 14280, OSHA | Integração com ADP ou API folha; tabela `apontamento_horas` |
| **P2** | Near-miss e indicadores leading | Iceberg Heinrich/Bird, OSHA | Tipo de ocorrência + dashboard segregado |
| **P2** | LGPD: ROPA + retenção 20 anos + portal titular | LGPD + NR-7 | Módulo `/lgpd` no painel admin |
| **P2** | Benchmark setorial AEAT por CNAE | AEAT (Previdência) | Importação anual da tabela AEAT |
| **P3** | Tabela de dias debitados (NBR 14280) | NBR 14280:2001 | Catálogo de referência fixo |

---

## 5. URLs canônicas para uso no app (links externos)

```
eSocial — Documentação técnica
  https://www.gov.br/esocial/pt-br/documentacao-tecnica
eSocial — MOS S-1.3 NO 10/2026 (PDF)
  https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-3-consolidada-ate-a-no-s-1-3-10-2026.pdf
eSocial — Leiautes S-1.3 NT 06/2026 (HTML)
  https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-06-2026-rev-09-04-2026/index.html
eSocial — XSDs v_S_01_03_00 (ZIP)
  https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/2026-04-27_esquemas_xsd_v_s_01_03_00.zip
Planalto — Lei 14.457/2022
  http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14457.htm
Planalto — Lei 13.709/2018 (LGPD)
  http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
Planalto — Lei 13.467/2017 (Reforma Trabalhista)
  http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm
MTE — NRs (índice oficial)
  https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho
ANPD — Portal
  https://www.gov.br/anpd/pt-br
ANPD — Documentos técnicos orientativos
  https://www.gov.br/anpd/pt-br/centrais-de-conteudo/documentos-tecnicos-orientativos
Previdência — Saúde e Segurança do Trabalhador (AEAT)
  https://www.gov.br/previdencia/pt-br/assuntos/previdencia-social/saude-e-seguranca-do-trabalhador
MPT — Portal
  https://mpt.mp.br
ABNT Catálogo — NBR 14280
  https://www.abntcatalogo.com.br/ (buscar "14280")
```

---

## 6. Verificações pendentes (para fechamento de pesquisa)

1. Confirmar o **número exato da Portaria MTE de 2023/2024 que introduziu riscos psicossociais** no PGR. Pesquisa retornou "MTE 1.419/2024" como mais provável; o briefing menciona "1.378/2023" e "MTE 423/2021" — verificar no DOU.
2. Confirmar **data exata de obrigatoriedade plena do S-2245** (briefing pediu "verificar fase atual"). Resposta provisória: **2025–2026**, com cronograma escalonado por porte de empresa (Grupos 1 a 4 do eSocial).
3. Validar versão atual da **NBR 14280** (vigente desde 2001 com versão corrigida 2003; ABNT não publicou revisão posterior até o conhecimento da pesquisa).
4. Buscar a edição mais recente do **AEAT 2024** (deve já estar disponível em 2026).
5. Confirmar se a **Portaria MTP 4.219/2022** é o instrumento que atualizou a NR-5 incorporando a Lei 14.457 (alta probabilidade, mas verificar DOU).

---

*Fim do documento. Para perguntas específicas sobre mapeamento DB ↔ eSocial XML, consultar os agentes B (mapeamento técnico) e C (gaps de produto).*

# PGR de referÃªncia — Anatomia para Schema de Banco e Gerador de PDF

> Pesquisa derivada de três documentos-fonte:
> 1. `PGR_EXEMPLO.txt` — PGR completo da obra **Cliente Exemplo — Cliente** (cliente Exemplo), extraído de `.docx` (limpo, 4356 linhas).
> 2. `PGR_EXEMPLO_2.txt` — extraído de `.doc` Word 97-2003 via olefile. **Conteúdo binário irrecuperável** (mojibake `ꗬÁЖደ¿ကࠀ⥉橢橢Жর	誌櫲誌櫲...`). Grep não encontrou nenhuma palavra-chave em português. Marcado como `(não recuperável do .doc — consultar versão Word original)`.
> 3. `PGR_EXEMPLO_MATRIZ.txt` — extraído de `.doc` (template/matriz da empresa). **Também irrecuperável** (mesmo padrão de mojibake UTF-8 sobre bytes binários do `.doc`). Grep não encontrou nenhuma palavra-chave em português. Marcado como `(não recuperável do .doc — consultar versão Word original)`.
>
> **Conclusão prática:** toda a anatomia abaixo foi extraída exclusivamente do PGR_EXEMPLO. Considera-se que ele representa a aplicação do template MATRIZ a um caso real, então o template é inferível a partir dele. Recomendação ao engenheiro: para validar campos extras / variações de seções, converter `PGR_EXEMPLO_MATRIZ.doc` para `.docx` no Word antes de re-extrair.

---

## Section 1 — Document anatomy

### 1.1 Capa

Não há "capa" gráfica separada do conteúdo no extract (a capa do `.docx` original deve ter imagem/logo e formatação especial). O cabeçalho lógico (linhas 1-6) contém:

```
PGR/GRO
PROGRAMA DE GERENCIAMENTO DE RISCOS PROGRAMA DE RISCO OCUPACIONAL
Cliente Exemplo
```

Observação: o título engloba **PGR (NR-01)** e **GRO (Gerenciamento de Riscos Ocupacionais — NR-09 antiga PPRA)** no mesmo documento. a empresa trata como produto único.

**Campos da capa (inferidos):**
- Tipo de documento: "PGR/GRO"
- Subtítulo: "PROGRAMA DE GERENCIAMENTO DE RISCOS / PROGRAMA DE RISCO OCUPACIONAL"
- Cliente / razão social do tomador: `Cliente Exemplo`
- Logo: não recuperado do txt (existe no .docx)

### 1.2 Controle de Revisões

Tabela com colunas (verbatim das linhas 7-16):

| Coluna       | Exemplo (verbatim)                                                                                  |
|--------------|-----------------------------------------------------------------------------------------------------|
| Revisão      | `00`                                                                                                |
| Descrição da revisão | `Documento Inicial`                                                                          |
| Emissão (data) | `25/03/2026`                                                                                      |
| Revisão      | `01`                                                                                                |
| Descrição    | `Revisão de GHE'S01 Para o GHE 02 (Coodernador de Segurança, Axiliar de Prjetos e Engenheiro Projetista)` *(typos no original)* |
| Emissão      | `14/04/2026`                                                                                        |

**Schema sugerido:** tabela `pgr_revisao(id, pgr_id, numero_rev INT, descricao TEXT, data_emissao DATE)`. Não há coluna explícita de "responsável pela revisão" na tabela — o responsável aparece na seção seguinte (uma única assinatura para o doc).

### 1.3 Vigência

```
EMPRESA: EMPRESA EXEMPLO LTDA
Data da Emissão (Elaboração): 25/03/2026
Data da Revisão (Vencimento): 22/03/2027
```

**Periodicidade típica:** ~12 meses (25/03/2026 → 22/03/2027). Confirma a exigência da NR-01 de revisão anual.

### 1.4 Caracterização da Empresa (Contratada — a empresa)

Campos exatos (linhas 81-95):

| Campo | Valor verbatim |
|-------|----------------|
| Razão Social | `EMPRESA EXEMPLO LTDA` |
| CNPJ | `00.000.000/0001-00` |
| CNAE | `41.20-4` |
| Grau de Risco | `03` |
| Atividade | `Construção de Edifícios` |
| Nº Geral de empregados até | `400` |
| Endereço | `Rua Ouvidor Peleja, 111 - 9º Andar` |
| Bairro | `Vila Mariana` |
| Município | `São Paulo` |
| CEP | `04128-000` |
| Estado | `São Paulo` |
| Telefone | `(11) 3556-8700` |

### 1.5 Local de Atividade (Obra)

```
OBRA: CLIENTE EXEMPLO
Endereço: Rodovia Edgar Maximo Zamboto (Estrada do Campo Limpo)
Bairro: Glebas
Município: Franco da Rocha
Cep: 07834-000
Estado: São Paulo
CNO: 90.010.92255/71
Nº Geral de empregados até: 700
Início de Obra: 01/04/2026
```

Note dois números de empregados — um na empresa (400) e outro na obra (700). **Campo CNO** (Cadastro Nacional de Obras, Receita Federal) é distinto do CNPJ.

### 1.6 Responsáveis Técnicos

Aparece duplicado no extract (artefato docx2txt), formato verbatim:

```
RESPONSÁVEL PELA ELABORAÇÃO DO PGR
Nome: Fernanda Emiliano Cavalcante
Função: Supervisor de Segurança do Trabalho
CREA - SP 5069853674
```

**Encerramento (assinaturas no fim do corpo, antes dos anexos, linhas 1361-1385):**

```
São Paulo, 23 de março de 2026.

_____________________
Fernanda Emiliano Cavalcante
Supervisor de Segurança do Trabalho
CREA-SP 5069853674

_____________________
Adriano Soares Ferreira
Coordenador de Obras
CREA: 5063036176
```

Duas assinaturas: (1) o elaborador SST/SESMT, (2) o coordenador da obra. **Note:** o campo é "CREA" mesmo para "Supervisor de Segurança do Trabalho" — provavelmente é um registro CREA com modalidade Segurança, ou TMSE. a empresa não usa registro MTE explícito.

### 1.7 Sumário típico (linhas 121-169)

```
1  -  ASPECTOS GERAIS
2  -  RESPONSABILIDADES
3  -  ESTRATEGIA E METODOLOGIA DE DESENVOLVIMENTO DO PGR
4  -  REGISTRO, MANUTENÇÃO E DIVULGAÇÃO DOS DADOS DO PGR
5  -  DESENVOLVIMENTO DO PGR
6  -  PLANEJAMENTO DO PGR
7  -  ANALISE GLOBAL DO PGR
8  -  DISPOSIÇÕES FINAIS
9  -  ANEXO I  -  CRONOGRAMA ANUAL DE ATIVIDADES
10 -  ANEXO II - ANALISE PRELIMINAR DE RISCOS (APR) E CARACTERIZAÇÃO DOS GRUPOS HOMOGENEO DE EXPOSIÇÃO
11 -  ANEXO III - RECONHECIMENTO E CLASSIFICAÇÃO DA EXPOSIÇÃO AOS RISCOS AMBIENTAIS
12 -  ANEXO IV - AÇÕES PREVENTIVAS PARA PANDEMIA DE COVID-19
13 -  ANEXO V - RESULTADOS DAS AVALIAÇÕES QUANTITATIVAS DOS RISCOS AMBIENTAIS
14 -  ANEXO VI - MEDIDAS EXISTENTES E RECOMENDADAS PARA CONTROLE DA EXPOSIÇÃO OCUPACIONAL
15 -  ANEXO VIII - LISTA DE EPI POR GHE OU FUNÇÃO   (typo no original: numerado VIII em vez de VII)
16 -  ANEXO VIII - AVALIAÇÃO E GERENCIAMENTO DE RISCOS (AGR)
```

⚠ **Inconsistência verbatim:** o item 15 está rotulado como "ANEXO VIII" no sumário, mas internamente (linha 3448) aparece como `ANEXO VII`. O item 16 está como `ANEXO VIII` em ambos. O cabeçalho do conteúdo do anexo IV diz "Resultados das Avaliações Quantitativas" mas o sumário lista esse como ANEXO V. **A numeração de anexos do template a empresa é incoerente entre sumário e cabeçalhos internos.** No schema, recomenda-se usar id sequencial interno e armazenar o "rótulo" como string editável.

---

## Section 2 — Inventário de Riscos

### 2.1 Localização

- **ANEXO II** (linhas 1844-2235) = "Caracterização dos GHE + APR" (lista dos GHEs e suas funções/cargos/locais — pouco preenchido na matriz risco)
- **ANEXO III** (linhas 2237-3231) = "Inventário de Riscos" propriamente dito — uma linha por par GHE × risco

Anexo II é o **mapeamento estrutural** dos GHEs; Anexo III é a **lista de riscos por GHE**.

### 2.2 Colunas da tabela ANEXO II (Caracterização do GHE)

Cabeçalho verbatim (linhas 1849-1869):

```
ANEXO II - CARACTERIZAÇÃO DOS GRUPOS DE HOMOGÊNEO DE EXPOSIÇÃO - ANÁLISE PRELIMINAR DE RISCOS (APR)

Identificação da Área
Grupo Homogêneo de Exposição (GHE)
  - Código
  - Descrição
Identificação das Funções e Atividades
  - Função/Posição
  - Cargos Relacionados
  - Caracterização das Principais Atividades Desempenhadas
Locais Trabalho
Nº EE (número de empregados expostos)
DE / GA  (provavelmente Densidade de Empregados / Grupo de Avaliação — não definido no doc)
```

**Schema sugerido para GHE:**
```
ghe (
  id PK,
  pgr_id FK,
  codigo VARCHAR  -- ex: "GHE 01"
  descricao VARCHAR  -- ex: "ADMINISTRAÇÃO"
  funcao_posicao VARCHAR  -- ex: "Administração" / "Engenharia / Operacional"
  area_identificacao VARCHAR  -- ex: "CANTEIRO ADMINISTRATIVO" / "CANTEIRO OPERACIONAL"
  caracterizacao_atividades TEXT
  local_trabalho VARCHAR  -- ex: "Escritório", "Campo", "Escritório / Campo"
  num_empregados_expostos INT
)
ghe_cargo (ghe_id FK, cargo VARCHAR)  -- relação N:M
```

### 2.3 Colunas da tabela ANEXO III (Inventário de Riscos)

Cabeçalho verbatim (linhas 2243-2262):

```
ANEXO III - Reconhecimento e Classificação da Exposição aos Riscos Ambientais - INVENTÁRIO DE RISCOS

Grupo Homogêneo de Exposição (GHE)
  - Código
  - Descrição
Caracterização do Agente
  - Agente Ambiental
  - Código eSocial
Caracterização da Exposição
  - Possíveis Fontes Geradoras
  - Trajetória/Propagação
  - Via de Ingresso
  - Possíveis Danos à Saúde
Classificação da Exposição
  - Tipo de Exposição
  - Categoria de Risco
```

**Schema sugerido para item de inventário:**
```
risco_inventario (
  id PK,
  ghe_id FK,
  agente_ambiental VARCHAR,        -- "RUÍDO", "CALOR", "POEIRA MINERAL", "QUEDA DE ALTURA", etc.
  codigo_esocial VARCHAR,          -- "02.01.001", "05.01.001", "01.18.001", "02.01.999"
  categoria_risco_origem ENUM      -- físico / químico / biológico / ergonômico / acidente (inferida; NÃO aparece como coluna)
  fontes_geradoras TEXT,           -- "VEÍCULOS E MÁQUINAS NA AREA INTERNA"
  trajetoria VARCHAR,              -- "Externa", "Ambiente", "Radiação Solar", "Contato direto", "Ar / Ambiente"
  via_ingresso VARCHAR,            -- "Ar", "Ambiente", "Não se aplica", "Radiação Solar"
  possiveis_danos TEXT,            -- "Trauma acústico, Perda auditiva induzida por ruído, stress, fadiga, irritabilidade."
  tipo_exposicao ENUM,             -- "Eventual" / "Moderado" / "Habitual" (no doc só aparecem Eventual e Moderado)
  categoria_classificacao ENUM     -- "Baixo" / "Médio" / "Alto"   (no doc também aparece "Eventual" deslocado, é erro de extração)
)
```

### 2.4 Matriz probabilidade × severidade

**Não há matriz numérica X×Y explícita** no PGR_EXEMPLO. A classificação final é qualitativa, com dois eixos cruzados:

- **Tipo de Exposição:** `Eventual` ou `Moderado` (não vi "Habitual" mas o template pode ter)
- **Categoria de Risco (final):** `Baixo`, `Médio`, `Alto`

Não há campo numérico de probabilidade nem de severidade individualmente. A categoria final parece derivada de critérios qualitativos descritos nas seções 3.2 (Reconhecimento) e 5 (Monitoramento). Para gerenciar isso no banco, sugere-se:

```
risco_inventario.tipo_exposicao   ENUM ('Eventual','Moderado','Habitual')
risco_inventario.categoria_risco  ENUM ('Muito Baixo','Baixo','Médio','Alto','Muito Alto')
```

Conforme texto da seção 4 (linhas 706-780), as categorias usadas pelo cliente são: **Muito Baixo, Baixo, Médio, Alto, Muito Alto**. Critério de monitoramento:
- "Médio": revisão a cada 3 anos
- "Alto" e "Muito Alto": revisão a cada 5 anos
- "Muito Baixo" e "Baixo": monitoramento facultativo, baseado em julgamento profissional

### 2.5 GHEs reais da obra Exemplo (7 GHEs)

| Código | Função/Posição                  | Área                                      | Local              |
|--------|---------------------------------|-------------------------------------------|--------------------|
| GHE 01 | Administração                   | CANTEIRO ADMINISTRATIVO                   | Escritório         |
| GHE 02 | Engenharia / Operacional        | CANTEIRO ADMINISTRATIVO OPERACIONAL DE APOIO | Escritório / Campo |
| GHE 03 | Operacional                     | CANTEIRO OPERACIONAL                      | Campo              |
| GHE 04 | Operacional - Limpeza           | OPERACIONAL LIMPEZA                       | Campo              |
| GHE 05 | Operacional - Pintura           | OPERACIONAL PINTURA                       | Campo              |
| GHE 06 | Operacional - Mecânica          | OPERACIONAL MECANICA                      | Campo              |
| GHE 07 | Operacional - Civil             | OPERACIONAL CIVIL                         | Campo              |

### 2.6 Exemplos REAIS de inventário (verbatim do PGR_EXEMPLO)

| GHE | Função | Agente Ambiental | Cód. eSocial | Fontes Geradoras | Trajetória | Via Ingresso | Possíveis Danos | Tipo Exposição | Categoria |
|---|---|---|---|---|---|---|---|---|---|
| GHE 01 | ADMINISTRAÇÃO | RUÍDO | 02.01.001 | VEÍCULOS E MÁQUINAS NA AREA INTERNA | Externa | Ar | Trauma acústico, Perda auditiva induzida por ruído, stress, fadiga, irritabilidade. | Eventual | Baixo |
| GHE 01 | ADMINISTRAÇÃO | QUEDA DE MESMO NÍVEL | 05.01.001 | VIAS DE ACESSO -LOCAL DE TRABALHO | Ambiente | Ambiente | Acidentes do trabalho | Eventual | Baixo |
| GHE 01 | ADMINISTRAÇÃO | POSTURA | 05.01.001 | MOBILIÁRIO | Ambiente | Ambiente | Fadiga, Estresse, Lesões osteomioarticulares | Moderado | Médio |
| GHE 01 | ADMINISTRAÇÃO | CALOR | 05.01.001 | ATIVIDADE A CEU ABERTO | Radiação Solar | Radiação Solar | Lesões Dermatológicas, queimaduras, Desidratação, Fadiga. | Eventual | Baixo |
| GHE 01 | ADMINISTRAÇÃO | RADIAÇÃO NÃO IONIZANTE | 05.01.001 | ATIVIDADE A CEU ABERTO | Ambiente | Condições Climáticas | Dermatológicas, Queimaduras, | Eventual | Baixo |
| GHE 02 | ADM/APOIO OPERACIONAL | POEIRA MINERAL | 01.18.001 | PROXIMIDADE COM ATIVIDADES MONTAGEM ELETROMECÂNICA, MOVIMENTAÇÃO DE VEÍCULOS E CARGAS | Ambiente | Ambiente | Irritação das vias respiratórias | Eventual | Eventual *(erro de extração — deveria ser Baixo/Médio)* |
| GHE 02 | ADM/APOIO OPERACIONAL | ESPAÇO CONFINADO | 05.01.001 | ATIVIDADES EM LOCAIS NÃO PROJETADOS PARA OCUPAÇÃO HUMANA | Ambiente | Ambiente | Lesões por queda (contusões, fraturas, torções), Tontura, Asfixia, Perda de consciência, Mortes | Moderado | Alto |
| GHE 03 | OPERACIONAL | QUEDA DE ALTURA | 05.01.001 | ATIVIDADES DE ACOMPANHAMENTO E INSPEÇÃO - TRABALHO SOBRE SUPERFÍCIES ELEVADAS | Ambiente | Ambiente | Lesões por queda (contusões, fraturas, torções), mortes | Moderado | Alto |
| GHE 03 | OPERACIONAL | ELETRICIDADE / CHOQUE ELÉTRICO | 05.01.001 | INSTALAÇÕES ELÉTRICAS | Contato direto | Ambiente | Queimaduras, Parada cardiorrespiratória, morte | Eventual | Alto |
| GHE 03 | OPERACIONAL | ANIMAIS PEÇONHENTOS | 05.01.001 | ATIVIDADES OPERACIONAIS | Externa | Ambiente | Lesões, Dermatológicas, queimaduras, picadas Ferimentos provenientes de animais silvestres | Moderado | Médio |
| GHE 05 | OPERACIONAL PINTURA | SOLVENTES NEVOAS | 02.01.999 | ATIVIDADES OPERACIONAIS | Ar / Ambiente | Ar / Ambiente | Lesões Dermatológicas, queimaduras, Irritação das vias respiratória e problemas | Eventual | Baixo |
| GHE 06 | OPERACIONAL MECANICA | FUMOS METALICOS | 05.01.001 | ATIVIDADES OPERACIONAIS | Externa | Ambiente | Dermatológicas | Eventual | Baixo |
| GHE 06 | OPERACIONAL MECANICA | GRAXAS | 05.01.001 | ATIVIDADES OPERACIONAIS | Externa | Ambiente | Dermatológicas | Eventual | Baixo |
| GHE 07 | OPERACIONAL CIVIL | POEIRA DE MADEIRA | 01.18.001 | PROXIMIDADE COM ATIVIDADES MONTAGEM ELETROMECÂNICA, MOVIMENTAÇÃO DE VEÍCULOS E CARGAS | Ambiente | Ambiente | Irritação das vias respiratórias | Moderado | Médio |
| GHE 07 | OPERACIONAL CIVIL | QUEDA EM DIFERENTE NÍVEL | 05.01.001 | ATIVIDADES DE ACOMPANHAMENTO E INSPEÇÃO - TRABALHO SOBRE SUPERFÍCIES ELEVADAS | Ambiente | Ambiente | Lesões por queda (contusões, fraturas, torções), mortes | Moderado | (truncado) |

⚠ **Observações sobre dados:**
- Repete-se em quase todos os GHEs uma observação no rodapé da tabela: `Obs* Os riscos Físico / Químico / Biológicos / Acidentes / Ergonômicos - Deverão acompanhar a diretriz do cliente conforme suas revisões.`
- O **código eSocial** é repetido para muitos riscos diferentes (ex: 05.01.001 cobre queda, calor, postura, animais peçonhentos, eletricidade, espaço confinado…). Isso **não corresponde** ao uso real da Tabela 24 do eSocial — sugere que a empresa usa códigos genéricos como placeholders. Ver Section 5.
- A coluna "Categoria" às vezes recebe valor "Eventual" por erro de extração/preenchimento (ex.: GHE 02 — POEIRA MINERAL aparece com tipo "Eventual" e categoria "Eventual"). No banco, validar enum estrito.

---

## Section 3 — Plano de Ação

### 3.1 Localização

Dois lugares distintos no PGR:

1. **Seção 6 (PLANEJAMENTO DO PGR)** — linhas 989-1324 — plano 5W2H **conceitual** (etapas de antecipação, reconhecimento, avaliação, controle, registro, auditoria). Genérico para todo PGR.
2. **ANEXO I — CRONOGRAMA ANUAL DE ATIVIDADES** — linhas 1395-1839 — plano 5W2H **operacional**, com 17 itens numerados, datas concretas, status.

### 3.2 Colunas do plano 5W2H

Formato verbatim (linhas 1018-1023 e 1402-1426):

| Coluna (corpo seção 6) | Coluna (Anexo I cronograma) |
|---|---|
| O QUE? | O QUE FAZER? (DESCRIÇÃO DA AÇÃO PARA ADEQUAÇÃO AO ITEM) |
| QUANDO? | QUANDO? |
| ONDE? | ONDE? |
| POR QUE? | PORQUÊ? |
| QUEM? | QUEM? (DESCREVER O NOME DO RESPONSÁVEL PELO GERENCIAMENTO DA AÇÃO) |
| COMO? | COMO? |
| — | STATUS DA AÇÃO? (CONCLUÍDA / EM ANDAMENTO / PENDENTE) |
| — | OBSERVAÇÕES |

**Note:** falta a coluna **QUANTO?** (custo) — o 5W2H clássico tem 7 perguntas, a empresa usa só 6 + status + obs. Não há gestão de custo no PGR.

### 3.3 Schema sugerido

```
acao_plano (
  id PK,
  pgr_id FK,
  numero_item INT,        -- "1", "2", ..., "17"
  o_que TEXT,             -- ação
  quem VARCHAR,           -- "SMS", "TODOS", "SMS/EMPRESA"
  onde VARCHAR,           -- "MATRIZ", "Obra Exemplo", "Nas Gerências a empresa"
  quando VARCHAR,         -- "03/2026", "PERIODICO", "PERMANENTE", "NA ADMISSÃO E MANUTENÇÃO NO DDS"
  por_que TEXT,
  como TEXT,
  status ENUM,            -- "Concluído" / "Concluida" / "Em andamento" / "Planejado" / "Pendente" / "Continuo" / "Andamento RH"
  observacoes TEXT
)
```

⚠ **Status no doc original usa variações** ("Concluído", "Concluida", "Concuido" *(typo)*, "Em andamento", "Planejado", "Continuo", "Andamento RH"). No banco, normalizar para enum fixo.

### 3.4 Responsável típico

Quase tudo é "SMS" (Serviço de Meio Ambiente e Segurança — equivalente ao SESMT). Casos:
- `SMS` — 14 itens
- `TODOS` — 2 itens (controle de validade CA, arquivo de ficha EPI)
- `SMS/EMPRESA` — 1 item (auditoria)

Não há atribuição nominal a uma pessoa específica nos itens. A única pessoa nomeada aparece na seção de assinaturas (Fernanda Cavalcante / Adriano Soares Ferreira).

### 3.5 Exemplos REAIS do Anexo I (cronograma, verbatim)

| # | O que fazer? | Quem? | Onde? | Quando? | Por quê? | Como? | Status |
|---|---|---|---|---|---|---|---|
| 1 | Emissão do Anexo II - Análise Preliminar de Riscos - Higiene Ocupacional (APR-HO) E Caracterização Dos Grupos Homogêneos De Exposição | SMS | MATRIZ | 03/2026 | Atender e garantir a eficácia do programa | Levantamento de campo e experiências anteriores | Concuido *(typo)* |
| 2 | Emissão do Anexo III - Reconhecimento e Classificação da Exposição aos Riscos Ambientais | SMS | MATRIZ | 03/2026 | Para garantir eficácia do PRG *(typo)* | Levantamento de campo e experiências anteriores | Concluída |
| 3 | Emissão da estratégia de amostragem de acordo APR-HO. | SMS | MATRIZ | 10/2026 | Atender legislação | Levantamento de campo e experiências anteriores | Concluída |
| 4 | Realizar Relatório Técnico, de acordo com NBR 10151, planilhas de campo, certificado de calibração dos equipamentos. | SMS | MATRIZ | 07/2026 | Avaliar quantitativamente postos de trabalho. | Avaliação quantitativa por empresa especializada | Planejado |
| 5 | Emissão do Anexo IV - Resultados das Avaliações Quantitativas / Risco Ambiental Avaliações Dosimetria - Poeira / Particulado. | SMS | MATRIZ | 11/2026 | Avaliar quantitativamente postos de trabalho. | Através do APRHO | Planejado |
| 6 | Emissão do Anexo V - Medidas Existentes e Recomendadas Para Controle da Exposição Ocupacional | SMS | MATRIZ | 03/2026 | Garantir medidas minimizando ou eliminando o risco | Através de medidas preventivas individuais, coletivas ou administrativas | Concluído |
| 7 | Emissão do Plano de Ação das recomendações do Relatório Técnico | SMS | MATRIZ | 10/2026 | Garantir medidas minimizando ou eliminando o risco | Através de medidas preventivas individuais, coletivas ou administrativas | Concluído |
| 8 | Emissão do Anexo VI - Lista de EPI por GHE/Função | SMS | MATRIZ | 03/2026 | Padronizar os EPI'S | Tornando obrigatório o uso dos EPI'S | Concluído |
| 9 | Emissão do Anexo VII - Avaliação e Gerenciamento de Riscos - AGR | SMS | MATRIZ | PERIODICO | Definir as prioridades | Avaliando os resultados das análises quantitativas. | Continuo |
| 10 | Divulgar Avaliação e Gerenciamento de Riscos - AGR/ARA para os envolvidos, dando ênfase aos riscos médio, alto e muito alto. | SMS | MATRIZ | PERIODICO | Informar os colaboradores | Através de Contato na área com os trabalhadores | Em andamento |
| 12 | Controlar a validade de Certificado de Aprovação - C.A., dos Equipamentos de Proteção Individual - EPI. | TODOS | MATRIZ | PERMANENTE | Controle de validade | Através do Manual de EPI'S | Concluído |
| 16 | Enviar todas as FISPQ'S (Ficha de Identificação de Produtos Químicos) para avaliação e liberação de uso da equipe de SSMA. | SMS | MATRIZ | PERMANENTE | Para informação dos riscos da obra | Solicitando as FISPQ'S aos fornecedores de produtos químicos | Planejado |
| 17 | Emissão, controle e monitoramento de PGRS (plano de gerenciamento de resíduos sólidos). | SMS | MATRIZ | PERMANENTE | Redução, controle e melhoria continua do meio ambiente | Documentação, Controle, Monitoramento e Palestras educacionais | Concluído |

---

## Section 4 — Riscos típicos detectados nas obras da empresa

Lista completa de riscos identificados no inventário do PGR_EXEMPLO, agrupados por categoria de origem (categorização inferida — o doc não rotula explicitamente). Fonte para **TODOS** os riscos abaixo: `PGR_EXEMPLO.txt` (PGR_EXEMPLO_2 e PGR_MATRIZ não recuperáveis).

### 4.1 Riscos Físicos

| Agente | Cód. eSocial usado | Fontes/Atividades |
|---|---|---|
| RUÍDO | 02.01.001 | Veículos e máquinas (área interna e externa), equipamentos |
| CALOR | 05.01.001 *(eSocial real seria 02.01.002)* | Atividade a céu aberto, radiação solar |
| RADIAÇÃO NÃO IONIZANTE | 05.01.001 *(eSocial real 02.01.014)* | Atividade a céu aberto, condições climáticas |
| UMIDADE | 05.01.001 | Atividades de limpeza |

### 4.2 Riscos Químicos

| Agente | Cód. eSocial usado | Fontes/Atividades |
|---|---|---|
| POEIRA MINERAL | 01.18.001 | Proximidade com montagem eletromecânica, movimentação de veículos e cargas |
| POEIRA DE MADEIRA | 01.18.001 | Atividades operacional civil (corte, lixamento) |
| SOLVENTES NEVOAS | 02.01.999 | Atividades operacionais de pintura |
| FUMOS METALICOS | 05.01.001 | Atividades operacionais de mecânica (solda) |
| GRAXAS | 05.01.001 | Atividades operacionais de mecânica |

### 4.3 Riscos Biológicos

| Agente | Cód. eSocial | Fontes/Atividades |
|---|---|---|
| SECREÇÕES | 05.01.001 | Limpeza |
| (Implícito: pneumonia, hepatite, infecções, gripes, fungos) | — | Mencionado em "Possíveis Danos à Saúde" das linhas de UMIDADE e SECREÇÕES |

⚠ Inventário pobre em agentes biológicos — provavelmente porque obra civil tem baixa exposição. a empresa basicamente só lista "secreções" e "umidade" como agente bio.

### 4.4 Riscos Ergonômicos

| Agente | Cód. eSocial | Fontes/Atividades |
|---|---|---|
| POSTURA | 05.01.001 | Mobiliário (escritório) |
| EM PÉ POR LONGOS PERIODOS | 05.01.001 | Atividades operacionais (campo) |

(Não há na matriz: levantamento de peso, repetitividade, monotonia, psicossociais — provavelmente porque tratados separadamente via AET/NR-17, embora as `Possíveis Danos` listem "Estresse, Fadiga, Lesões Osteomioarticulares".)

### 4.5 Riscos de Acidente / Mecânicos

| Agente | Cód. eSocial | Fontes/Atividades |
|---|---|---|
| QUEDA DE MESMO NÍVEL / QUEDA EM MESMO NÍVEL | 05.01.001 | Vias de acesso, local de trabalho |
| QUEDA DE ALTURA / QUEDA EM DIFERENTE NÍVEL | 05.01.001 | Acompanhamento e inspeção, trabalho sobre superfícies elevadas ou abaixo do solo |
| QUEDA DE MATERIAIS | 05.01.001 | Manuseio de materiais |
| FAGULHA / PROJETEIS | 05.01.001 | Atividade de corte |
| ELETRICIDADE / CHOQUE ELÉTRICO | 05.01.001 | Instalações elétricas (contato direto) |
| ESPAÇO CONFINADO | 05.01.001 | Atividades em locais não projetados para ocupação humana |
| ANIMAIS PEÇONHENTOS | 05.01.001 | Atividades operacionais (campo aberto) |

### 4.6 Combinações GHE × Risco (matriz de presença)

| Risco | GHE01 | GHE02 | GHE03 | GHE04 | GHE05 | GHE06 | GHE07 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| RUÍDO | x | x | x | x | x | x | x |
| QUEDA DE MESMO NÍVEL | x | x | x | x | x | x | x |
| POSTURA | x | | | | | | |
| CALOR | x | x | x | | x | x | x |
| RADIAÇÃO NÃO IONIZANTE | x | x | x | x | x | x | |
| POEIRA MINERAL | | x | x | x | x | x | |
| POEIRA DE MADEIRA | | | | | | | x |
| QUEDA DE ALTURA / DIFERENTE NÍVEL | | x | x | x | x | x | x |
| QUEDA DE MATERIAIS | | x | | | | | |
| ELETRICIDADE | | x | x | | x | x | |
| ESPAÇO CONFINADO | | x | x | | x | x | |
| FAGULHA / PROJETEIS | | | x | | x | x | x |
| EM PÉ POR LONGOS PERIODOS | | | x | x | x | x | |
| ANIMAIS PEÇONHENTOS | | | x | | x | x | |
| SECREÇÕES | | | | x | | | |
| UMIDADE | | | | x | | | |
| SOLVENTES NEVOAS | | | | | x | | |
| FUMOS METALICOS | | | | | | x | |
| GRAXAS | | | | | | x | |

---

## Section 5 — Agentes nocivos eSocial (Tabela 24)

**Aviso crítico:** os códigos eSocial usados no PGR_EXEMPLO **não estão corretos** segundo a Tabela 24 oficial. O documento usa apenas 4 códigos como placeholders:

| Código no doc | Quantas vezes aparece | Códigos eSocial oficiais correspondentes |
|---|---|---|
| `02.01.001` | RUÍDO contínuo/intermitente — só este caso é correto (Tabela 24: 02.01.001 = Ruído) |
| `05.01.001` | usado para QUEDAS, CALOR, RAD. NÃO IONIZANTE, POSTURA, ELETRICIDADE, ESPAÇO CONFINADO, ANIMAIS, GRAXAS, FUMOS, SECREÇÕES, UMIDADE, FAGULHA, etc. — **placeholder genérico**. Tabela 24 oficial: 05.01.001 = "Ausência de agente nocivo ou de atividades previstas no Anexo IV do Decreto 3.048/1999" |
| `01.18.001` | POEIRA MINERAL e POEIRA DE MADEIRA — pode ser correto para alguns particulados; tabela 24 tem 01.18.xxx para "Outras Poeiras" |
| `02.01.999` | SOLVENTES NEVOAS — usado como "agente físico não especificado". Solventes deveriam estar em 01.xx.xxx (químicos) |

**Recomendação para o schema:** manter o campo `codigo_esocial VARCHAR` mas **adicionar tabela de referência `esocial_agente_nocivo`** com os códigos oficiais da Tabela 24 (consultar `agent-a-esocial-kpis-legislacao.md` no diretório `docs/research/`) e validar via constraint na geração do PDF. O sistema deve **alertar** quando o usuário usa um código incompatível com o agente. Considerar:

```
esocial_agente_nocivo (
  codigo VARCHAR PK,           -- '02.01.001'
  descricao TEXT,              -- 'Ruído'
  grupo VARCHAR,               -- 'Físico'/'Químico'/'Biológico'/'Associação'
  exige_aposentadoria_especial BOOLEAN
)
```

---

## Section 6 — Cargos / funções mencionados

Por GHE (verbatim do Anexo II):

### GHE 01 — Administração (Cargos Administrativos, atividades no escritório)
- Assistente Administrativo de Obras
- Auxiliar Administrativo
- Assistente Administrativo
- Analista de Suprimentos
- Analista Financeiro
- Analista de RH
- Auxiliar de Escritório
- Aprendiz
- Assistente Depto Pessoal
- Assistente Comercial
- Assistente de Compras
- Assistente de Recursos Humanos
- Auxiliar de Depto. Pessoal
- Coordenador de Obras
- Coordenador de Engenharia
- Coordenador de Segurança
- Coordenador de Planejamento
- Coordenador de Qualidade
- Coordenador de Manutenção
- Estagiário de Planejamento
- Comprador
- Desenhista Projetista
- Engenheiro de Planejamento
- Engenheiro Projetista
- Encarregado de Logística
- Estagiário Administrativo
- Auxiliar de RH

### GHE 02 — Engenharia / Operacional (Cargos Administrativos e Operacionais de Apoio, escritório/campo, planejamento e acompanhamento)
- Analista de Engenharia
- Supervisor de Obras
- Estagiário de Engenharia
- Supervisor de Elétrica
- Supervisor de Civil
- Supervisor de Mecânica
- Supervisor de Segurança
- Auxiliar de Engenharia
- Auxiliar de Seg. do Trabalho
- Técnico de Seg. do Trabalho
- Assistente de Engenharia
- Auxiliar de Projetos
- Engenheiro Especialista
- Engenheiro de Projetos
- Encarregado de Obras
- Encarregado de Hidráulica
- Coordenador de Segurança
- Engenheiro Projetista
- Líder de Elétrica
- Líder de Hidráulica
- Líder Civil
- Mestre de Obras
- Engenheiro Especialista em Instalações
- Engenheiro Mecânico Especializado
- Engenheiro de Planejamento
- Planejador
- Gerente de Contrato
- Desenhista Projetista
- Almoxarife Central
- Almoxarife de Obras
- Auxiliar de Almoxarife
- Assistente de Almoxarife
- Técnico de Planejamento
- Técnico Projetista
- Motorista
- Coordenador de Orçamentos
- Supervisor de Qualidade

### GHE 03 — Operacional (Cargos Operacionais, atividades operacionais no campo)
- Ajudante Geral
- Ajudante de Obras
- Meio Oficial de Elétrica
- Eletricista
- Encanador
- Técnico Eletrotécnico
- Técnico de Implantação

### GHE 04 — Operacional Limpeza
- Líder de Limpeza
- Ajudante de Limpeza

### GHE 05 — Operacional Pintura
- Pintor
- Líder de Pintura
- Encarregado de Pintura

### GHE 06 — Operacional Mecânica
- Mecânico de Refrigeração
- Auxiliar de Mecânica
- Meio Oficial de Mecânica

### GHE 07 — Operacional Civil
- Pedreiro

**Atividades típicas (verbatim):**
- GHE 01: "Atividades administrativas realizadas de acordo com a Descrição de Serviço NR 01"
- GHE 02: "Atividades administrativas e operacionais, planejamento de obras, realizadas no container e no campo, e acompanhamento de obras."
- GHE 03-07: "Atividades operacionais" (genérico)

---

## Section 7 — Medidas de controle

### 7.1 Hierarquia adotada (linhas 729-745) — equivale à hierarquia NIOSH

A NR adota a hierarquia: **engenharia/coletiva → administrativa → EPI** (não menciona explicitamente eliminação/substituição como categoria, embora liste "substituição de produtos químicos" dentro da engenharia/coletiva):

1. **Medidas de proteção coletiva** (engenharia)
   - Dispositivos de enclausuramento, limitação ou isolamento
   - Sistemas de ventilação ou exaustão
   - Modificação do layout, processo produtivo, máquinas e equipamentos
   - Substituição de produtos químicos

2. **Medidas administrativas e de organização do trabalho**
   - Modificação do ciclo de trabalho, atividades e redução do tempo de exposição
   - Redução ou adequação da jornada de trabalho
   - Medidas de organização, limpeza e higiene
   - Implantação de programas (PCMSO, PCA, PPR)

3. **Medidas de proteção individual (EPI)**
   - Seleção, fornecimento, uso, manutenção e substituição

### 7.2 Estrutura do Anexo VI — Medidas existentes/recomendadas

Cabeçalho verbatim (linhas 3403-3409):

```
Agente Ambiental | Tipo de Medida | Ação | Detalhamento | Abrangência | Periodicidade | Status
```

Exemplos REAIS (linhas 3410-3431):

| Agente Ambiental | Tipo de Medida | Ação | Detalhamento | Abrangência | Periodicidade | Status |
|---|---|---|---|---|---|---|
| Ruído | Individual | Uso de EPI | Uso de protetor auricular tipo plug | Quando ultrapassar 80db | Quando necessário | Eventual |
| Poeira Total | Individual | Uso de EPI | Uso de mascara PFF2 | Analisar necessidade de acordo com a atividade | Quando necessário | Eventual |

⚠ O Anexo VI no PGR_EXEMPLO está **quase vazio** — apenas 2 linhas preenchidas. Provavelmente um cliente real preenche mais. Observação no doc: "Os riscos inseridos tratam-se da mobilização de obra."

### 7.3 Schema sugerido

```
medida_controle (
  id PK,
  pgr_id FK,
  ghe_id FK NULL,                  -- pode ser geral ou por GHE
  agente_ambiental VARCHAR,        -- FK opcional para tabela esocial_agente
  tipo_medida ENUM,                -- 'Coletiva' / 'Administrativa' / 'Individual' (EPI) / 'Engenharia' / 'Substituição'
  nivel_niosh ENUM,                -- 'Eliminação' / 'Substituição' / 'Engenharia' / 'Administrativa' / 'EPI'  (gerado/inferido)
  acao TEXT,                       -- "Uso de EPI"
  detalhamento TEXT,               -- "Uso de protetor auricular tipo plug"
  abrangencia TEXT,                -- "Quando ultrapassar 80db"
  periodicidade VARCHAR,           -- "Quando necessário", "Permanente", "Eventual"
  status ENUM
)
```

### 7.4 Lista completa de EPIs do Anexo VII (linhas 3478-3994)

Anexo é matricial: **linhas = EPIs**, **colunas = GHEs**, células `P` (Permanente), `E` (Eventual), ou vazio. Asterisco `*` = "Atividades específicas".

Lista de EPIs identificados no extract:

| EPI | Observação |
|---|---|
| Capacete | P em todos os GHEs |
| Óculos | P em todos |
| Óculos Ampla Visão * | Atividades específicas |
| Botina | P em todos |
| Protetor Auditivo Concha | E em GHE 01-02, mais frequente em operacionais |
| Protetor Auditivo Plug | Mix P/E |
| Respirador Filtro PFF2 * | Atividades específicas |
| Respirador Semi Facial * | Atividades específicas |
| Filtro Químico * | Atividades específicas |
| Bota de PVC | P/E |
| Perneira Raspa | E |
| Calça com refletivo | P em todos |
| Camisa com refletivo | P em todos |
| Luva Nitrílica | P/E |
| Luva PVC | (vazio no extract) |
| Luva Neoprene | (vazio) |
| Luva Multitato | P/E |
| Luva de Raspa | E |
| Luva Vaqueta | E |
| Luva Anti-vibração | (vazio) |
| Luva Cirúrgica | E |
| Creme Protetor | E |
| Avental Raspa | (vazio) |
| Blusão PVC | (vazio) |
| Blusão Raspa | (vazio) |
| Macacão PVC | E |
| Macacão Tyvex | E |
| Creme Bloqueador Solar | P em campo |
| Colete Refletivo | P em campo |

A extração do Anexo VII está bagunçada (muitas células P/E aparecem em linhas separadas das labels — artefato da matriz no docx). A estrutura lógica é clara, mas para preencher o schema o engenheiro deve abrir o `.docx` original.

**Schema sugerido para matriz EPI:**
```
epi (
  id PK,
  nome VARCHAR,                    -- "Capacete"
  tipo VARCHAR NULL,               -- "Proteção Cabeça" / "Proteção Auditiva" / etc
  requer_ca BOOLEAN
)
ghe_epi (
  ghe_id FK,
  epi_id FK,
  uso ENUM,                        -- 'Permanente' / 'Eventual' / 'AtividadeEspecifica'
  observacao TEXT
)
epi_funcionario_ficha (    -- já mencionada no cronograma item 13
  id PK,
  funcionario_id FK,
  epi_id FK,
  ca_numero VARCHAR,
  data_entrega DATE,
  data_substituicao DATE,
  arquivado_pgr_id FK NULL          -- arquivado por 20 anos como anexo
)
```

---

## Section 8 — Treinamentos exigidos

O PGR_EXEMPLO **não tem seção dedicada a treinamentos com CH e periodicidade**. As NRs aplicáveis são listadas no objetivo (linha 232):

```
NR 01, NR 04, NR 05, NR 06, NR-07, NR 09, NR-10, NR 11, NR 12, NR 15, NR 16,
NR 17, NR-18, NR 20, NR 23, NR 24, NR 26, NR 33 e NR-35
```

Treinamentos citados em diversos pontos do corpo:
- **Integração** (NR-18) — admissão (item 15 do cronograma)
- **Diálogo Diário de Segurança (DDS)** — periódico (item 14, 15)
- **Treinamento de uso de EPI** (item 14)
- **Treinamento Brigada de Emergência** — periódico (linha 975)
- **Simulados periódicos** (linha 976)
- **Treinamento introdutório** (linha 804)
- **Treinamentos específicos** (linha 806)

⚠ **CH e periodicidade não estão no documento.** Para o schema, sugerir tabela `treinamento(nome, nr_referencia, ch_horas, periodicidade)` populada por uma base mestre (catálogo) independente do PGR — o PGR só aponta para os treinamentos exigidos. Periodicidades canônicas para a empresa devem ser definidas pelo SESMT (ex: NR-35 = 8h inicial + 8h bienal; NR-10 = 40h inicial + 40h bienal SEP; NR-33 = 16h trabalhador autorizado + 8h reciclagem anual; NR-18 integração = 6h).

---

## Section 9 — Anexos típicos

A estrutura usada por a empresa (com numeração interna inconsistente — ver Section 1.7):

| Nº (sumário) | Nº (cabeçalho interno) | Título | Conteúdo |
|---|---|---|---|
| Anexo I | I | Cronograma Anual de Atividades | 5W2H + status, 17 itens típicos |
| Anexo II | II | APR + Caracterização dos GHE | Mapeamento de GHEs, funções, cargos, locais |
| Anexo III | III | Inventário de Riscos | Lista de pares GHE × risco com classificação |
| Anexo IV | IV | Ações Preventivas COVID-19 | Protocolos (legado pandemia) |
| Anexo V | IV (sic) | Resultados Avaliações Quantitativas | Vazio no EXEMPLO — planejado para 11/2026 |
| Anexo VI | V (sic) | Medidas Existentes e Recomendadas | Tabela agente × tipo medida × ação |
| Anexo VII (sumário diz VIII) | VII | Lista de EPI por GHE/Função | Matriz EPI × GHE |
| Anexo VIII | VIII | Avaliação e Gerenciamento de Riscos (AGR) | Vazio no EXEMPLO — preenchimento periódico |
| (não no sumário) | IX | Relatório de Análise Global | Anexado anualmente após revisão (item 11 cronograma) |

**Recomendação para o schema:** modelar anexos como **lista ordenada de tipos** com renderização polimórfica:

```
anexo_tipo ENUM (
  'CRONOGRAMA_5W2H',
  'CARACTERIZACAO_GHE',
  'INVENTARIO_RISCOS',
  'PROTOCOLO_COVID',
  'AVALIACOES_QUANTITATIVAS',
  'MEDIDAS_CONTROLE',
  'MATRIZ_EPI',
  'AGR',
  'ANALISE_GLOBAL',
  'OUTRO'
)
```

E permitir reordenação / renomeação (já que o template real é inconsistente).

---

## Section 10 — Observações sobre formato/template

### 10.1 Tipografia e numeração
- Numeração de seções principais: **arábica simples**, separada por hífens: `1 - ASPECTOS GERAIS`. Cada seção é repetida 2× no extract (artefato de docx2txt — heading + título dentro de página).
- Sub-itens com numeração arábica decimal: `1.1`, `1.2`, `1.3`...
- Anexos: numeração romana maiúscula (`ANEXO I`, `ANEXO II`...) — mas com inconsistências.
- Listas em bullet usam ▪ ou similar no Word original (no extract aparece como linhas indentadas com espaços).
- Fonte presumida: Arial ou Calibri (típico a empresa) — não inferível do txt.

### 10.2 Layout de tabelas
- Tabelas convertidas pelo docx2txt aparecem como blocos verticais — uma célula por linha, com indentação grande. Isso indica que no Word original são **tabelas reais** com colunas, não texto formatado.
- Cabeçalhos de tabela repetem-se a cada quebra de página.
- Há rodapé recorrente `PGR - Programa de Gerenciamento de Riscos` e referência ao formulário `SGI\Formulários\FO-121-00 PGR.doc` (linhas 3999-4000). **`FO-121-00` é o código do formulário a empresa para PGR** — útil para nomear o template no sistema.
- Paginação encontrada: o doc tem 57 páginas no `.docx` original (linha 3997: `57`).

### 10.3 Repetições e duplicações
- Quase todos os títulos de seção aparecem **duas vezes seguidas** (artefato de docx2txt em headings com formatação composta). No PDF original isso não acontece — é só ruído de extração.
- Existem typos no original que **devem ser preservados** se o objetivo é fidelidade: `Coodernador` (em vez de Coordenador), `Axiliar` (Auxiliar), `Prjetos` (Projetos), `Concuido` (Concluído), `Concluida` (sem acento), `PRG` (em vez de PGR), `ETERNA` (Externa), `ACOMPANHAMENT O` (Acompanhamento).

### 10.4 Diretrizes para o gerador de PDF

1. **Tabelas dinâmicas com cabeçalho repetido por página** — fundamental para inventário e cronograma.
2. **Capa com logo, razão social do cliente, nome da obra, revisão e data de vigência** — todos campos do banco.
3. **Folha de assinaturas** com mínimo de 2 assinantes (técnico SST + coordenador obra), com linhas para assinatura física + dados (nome / função / CREA).
4. **Sumário automático** baseado nas seções e anexos cadastrados.
5. **Numeração de páginas** no rodapé + título do PGR + código do formulário interno (`FO-121-00`).
6. **Rodapé recorrente** com referência ao SGI (Sistema de Gestão Integrada): `SGI\Formulários\FO-121-00 PGR.doc`.
7. **Suporte a observação por anexo** (ex: "Obs* Os riscos Físico / Químico... — Deverão acompanhar a diretriz do cliente conforme suas revisões.").
8. **Comparativo cliente vs obra**: o documento separa "Caracterização da Empresa" (a empresa — a contratada) de "Local de Atividade" (o cliente — onde a obra acontece). O schema precisa modelar essa relação:

```
empresa_contratada (id, razao_social, cnpj, cnae, grau_risco, endereco, ...)
obra (id, contratada_id FK, cliente_nome, endereco_obra, cno, data_inicio, num_empregados_max)
pgr (id, obra_id FK, data_emissao, data_vencimento, num_revisao, ...)
```

### 10.5 Outras tabelas técnicas no corpo (úteis como dados de referência)

- **Tabela 1 — Metodologias Analíticas e de Coleta** (linhas 349-441): mapeia agente ambiental → metodologia (NIOSH, NHO, ISO) → instrumental. Pode virar tabela de referência `metodologia_amostragem`.
- **Tabela 2 — Valores de Limites de Tolerância/Exposição e Níveis de Ação** (linhas 449-689): valores LT/TLV por agente, com unidade, jornada, fonte (NR-15, ACGIH, etc.). Pode virar tabela de referência `limite_exposicao_ocupacional`.

Estas tabelas técnicas são **idênticas no template** — não mudam por obra. Ficar como **seed data** do banco, não como dados de PGR específico.

---

## Recomendações finais ao engenheiro

1. **Modelar PGR como documento versionado** (`pgr_revisao` separada) — alterações disparam nova revisão, não overwrite.
2. **GHE é a entidade central** — quase tudo (inventário, EPIs, ações, treinamentos) gira em torno do GHE.
3. **Códigos eSocial** precisam validação por catálogo oficial; o template a empresa atual usa códigos inconsistentes.
4. **Cargos**: criar catálogo de cargos com vínculo N:M para GHE — o mesmo cargo pode estar em vários GHEs entre obras.
5. **Status com enums fixos** — o doc original usa strings livres com typos.
6. **Geração de PDF**: priorizar fidelidade ao formulário `FO-121-00` (SGI a empresa) — incluir assinaturas, rodapé padrão, numeração de páginas.
7. **Anexos como módulos plugáveis** — cada tipo (cronograma, inventário, EPI matrix, AGR, análise global) é um renderizador diferente.
8. **Tabelas de referência seed**: NR catálogo, eSocial Tabela 24, limites NR-15/ACGIH, metodologias NIOSH/NHO, CA de EPIs.
9. **PCMSO, APR, PT, PAE** — são documentos separados mas integrados ao PGR (mencionados em "Disposições Finais"). Considerar futuros módulos.
10. **Para validar variações de template:** converter manualmente os `.doc` antigos (EXEMPLO_2 e MATRIZ) para `.docx` antes de re-extrair — o conteúdo está perdido na extração atual via olefile.

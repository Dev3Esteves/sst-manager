import type { Manual } from "../tipos"

export const manuaisOperacao: Manual[] = [
  {
    slug: "exames",
    titulo: "Exames Médicos (PCMSO)",
    modulo: "Exames",
    categoria: "Operação",
    rota: "/exames",
    perfis: ["Administrador", "Técnico de Segurança", "RH"],
    resumo: "Registro de ASOs (admissional, periódico, etc.) com resultado, restrições e vencimento. Inclui leitura por OCR para extrair dados do ASO automaticamente.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Controla os exames ocupacionais do PCMSO por colaborador, com aptidão e vencimento — alimentando os alertas de Vencimentos e as autorizações que exigem ASO válido (NR-10/33/35)." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Em Exames, clique em 'Novo exame'.",
          "Selecione o colaborador e o tipo (admissional, periódico, retorno ao trabalho, mudança de função, demissional, complementar).",
          "Informe data de realização, data de vencimento, resultado (apto/inapto/apto com restrição) e o médico/CRM.",
          "Opcional: use a ferramenta de OCR para enviar a foto/PDF do ASO e pré-preencher os campos — revise antes de salvar.",
        ] },
      ] },
      { titulo: "Campos", blocos: [
        { tipo: "campos", itens: [
          { campo: "Tipo", descricao: "admissional, periódico, retorno_trabalho, mudanca_funcao, demissional, complementar.", obrigatorio: true },
          { campo: "Data de realização / vencimento", descricao: "Definem o status (vigente/vencido) e os alertas.", obrigatorio: true },
          { campo: "Resultado", descricao: "apto, inapto ou apto com restrição." },
          { campo: "Restrições", descricao: "Descreva claramente quando 'apto com restrição'." },
        ] },
      ] },
      { titulo: "Cenários", blocos: [
        { tipo: "cenario", situacao: "o ASO veio 'apto com restrição'", orientacao: "selecione o resultado correspondente e detalhe a restrição (ex.: 'não realizar trabalho em altura por 90 dias')." },
        { tipo: "cenario", situacao: "o exame está próximo do vencimento", orientacao: "o módulo Vencimentos sinaliza com antecedência; agende a renovação antes da data." },
        { tipo: "dica", texto: "Ao usar o OCR, sempre confira os campos extraídos — a leitura é uma ajuda, não substitui a conferência." },
      ] },
    ],
  },
  {
    slug: "dds",
    titulo: "DDS — Diálogo Diário de Segurança",
    modulo: "DDS",
    categoria: "Operação",
    rota: "/dds",
    perfis: ["Técnico de Segurança", "Encarregado de campo"],
    resumo: "Registro dos DDS com tema, mediador, tópicos e lista de participantes (com assinatura). Gera o documento e fica no histórico.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Documenta as conversas rápidas de segurança no início do turno — evidência de que o tema foi tratado com a equipe, com a lista de presença assinada." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Em DDS, clique em 'Novo DDS'.",
          "Informe tema, data, local, duração e o mediador.",
          "Liste os tópicos abordados.",
          "Adicione os participantes (busque por nome) e colete a assinatura de cada um e do mediador.",
          "Salve — o DDS é registrado e gera o documento.",
        ] },
      ] },
      { titulo: "Padrões de escrita — tema e tópicos", blocos: [
        { tipo: "padrao", recomendado: "Tema: 'NR-35 — Inspeção de cinto e pontos de ancoragem antes do içamento'. Tópico: 'Verificar costuras e mosquetões; ancorar sempre acima da cintura'", evitar: "Tema: 'Segurança'. Tópico: 'Falar sobre EPI'" },
        { tipo: "cenario", situacao: "houve um quase-acidente recente", orientacao: "use o DDS para tratar a lição aprendida — descreva o evento sem citar culpados e foque na medida preventiva." },
      ] },
    ],
  },
  {
    slug: "ocorrencias",
    titulo: "Ocorrências e Investigação",
    modulo: "Ocorrências",
    categoria: "Operação",
    rota: "/ocorrencias",
    perfis: ["Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Registro de acidentes, incidentes e quase-acidentes, com investigação (5 Porquês), ações corretivas e geração de CAT (eSocial S-2210) quando aplicável.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Centraliza os eventos de segurança e estrutura a investigação de causa raiz, com plano de ação — base para indicadores (TF/TG) e para a emissão de CAT." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Em Ocorrências, registre o evento: o que aconteceu, onde, quando, quem estava presente, natureza da lesão e agente causador.",
          "Abra a investigação e aplique os 5 Porquês para chegar à causa raiz.",
          "Defina ações corretivas com responsável e prazo.",
          "Se houver afastamento/lesão, gere a CAT (XML S-2210) para o eSocial.",
        ] },
      ] },
      { titulo: "Padrões de escrita — descrição e 5 Porquês", blocos: [
        { tipo: "padrao", recomendado: "Descrição factual: 'Durante a desforma, a peça escorregou e atingiu o pé do ajudante. Calçava botina sem biqueira.' Causa raiz (5º porquê): 'Não havia procedimento de desforma com ponto de pega definido.'", evitar: "'O funcionário foi descuidado e se machucou.'" },
        { tipo: "cenario", situacao: "foi um quase-acidente (sem lesão)", orientacao: "registre mesmo assim — quase-acidentes são os melhores indicadores preventivos. Não é necessário gerar CAT." },
        { tipo: "atencao", texto: "Na descrição e na investigação, foque em fatos e no sistema (procedimento, ambiente, ferramenta), não em culpar a pessoa. Isso fortalece a prevenção e a defesa." },
      ] },
      { titulo: "FAQ", blocos: [
        { tipo: "faq", itens: [
          { p: "Quando gerar CAT?", r: "Em acidente de trabalho com lesão (típico ou de trajeto) ou doença ocupacional. O sistema gera o XML do S-2210 e um TXT auxiliar." },
        ] },
      ] },
    ],
  },
  {
    slug: "inspecoes",
    titulo: "Inspeções de Segurança",
    modulo: "Inspeções",
    categoria: "Operação",
    rota: "/inspecoes",
    perfis: ["Técnico de Segurança", "Encarregado de campo"],
    resumo: "Checklists de inspeção por template, com conformidade calculada, foto da não-conformidade e funcionamento offline (sincroniza quando volta a conexão).",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Permite aplicar checklists no campo (mesmo sem internet), classificar cada item como conforme/não conforme/N.A., anexar foto da NC e calcular o % de conformidade." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Em Inspeções → Nova, escolha o template (checklist).",
          "Identifique empresa, local e data.",
          "Marque cada item: Conforme, Não conforme ou N/A.",
          "Em itens não conformes, descreva a não-conformidade e adicione uma foto de evidência.",
          "Finalize. Sem internet, a inspeção fica salva e sincroniza automaticamente quando a conexão volta.",
        ] },
      ] },
      { titulo: "Padrões de escrita — não-conformidade", blocos: [
        { tipo: "padrao", recomendado: "'Extintor da sala elétrica com carga vencida (validade 03/2026) — sinalização do piso apagada.' Ação imediata: 'isolar e solicitar recarga.'", evitar: "'Extintor irregular.'" },
        { tipo: "cenario", situacao: "o item não se aplica à área inspecionada", orientacao: "marque N/A — não deixe em branco nem marque como conforme; o N/A não penaliza o índice." },
      ] },
      { titulo: "Dicas", blocos: [
        { tipo: "dica", texto: "A foto é comprimida no aparelho antes de enviar, então funciona bem mesmo com internet fraca no canteiro." },
      ] },
    ],
  },
  {
    slug: "pgr",
    titulo: "PGR — Programa de Gerenciamento de Riscos",
    modulo: "PGR",
    categoria: "Operação",
    rota: "/pgr",
    perfis: ["Engenheiro de Segurança", "Técnico de Segurança"],
    resumo: "O documento central da NR-01 (GRO): GHEs, inventário de riscos, plano de ação 5W1H, medidas de controle (NIOSH) e matriz de EPI, com geração do PDF FO-121.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "O PGR estrutura o gerenciamento de riscos de uma obra: agrupa funções em GHEs, inventaria os riscos por categoria (físico, químico, biológico, ergonômico, acidente, psicossocial), define medidas de controle pela hierarquia NIOSH e o cronograma de ações (5W1H)." },
      ] },
      { titulo: "Estrutura e passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Crie o PGR vinculado a uma obra (revisão 0).",
          "Cadastre os GHEs (Grupos Homogêneos de Exposição) e os cargos de cada um.",
          "Para cada GHE, inventarie os riscos (Anexo III): agente, fontes, possíveis danos, tipo de exposição e categoria do risco.",
          "Defina as medidas de controle (Anexo VI) seguindo a hierarquia NIOSH (eliminação → EPI).",
          "Monte o plano de ação 5W1H (Anexo I) e a matriz EPI × GHE (Anexo VII).",
          "Gere o PDF FO-121 para assinatura/arquivo.",
        ] },
      ] },
      { titulo: "Integração com o Psicossocial", blocos: [
        { tipo: "paragrafo", texto: "Os riscos psicossociais (NR-01) podem ser lançados automaticamente no inventário a partir de uma campanha do módulo Psicossocial — categoria 'psicossocial'." },
        { tipo: "dica", texto: "Mantenha uma revisão por ciclo (normalmente 12 meses). Ao revisar, crie nova revisão; a anterior é preservada como histórico." },
      ] },
      { titulo: "Padrões de escrita — inventário", blocos: [
        { tipo: "padrao", recomendado: "Agente: 'RUÍDO contínuo'; Fonte: 'operação de serra circular'; Danos: 'PAIR'; Exposição: 'habitual'; Categoria: 'alto'", evitar: "Agente: 'barulho'; Danos: 'problema de ouvido'" },
        { tipo: "atencao", texto: "Quando todas as medidas de um risco estão em níveis NIOSH 4-5 (administrativa/EPI), reavalie: priorize controles mais altos (eliminação/engenharia) sempre que viável." },
      ] },
    ],
  },
  {
    slug: "psicossocial",
    titulo: "Riscos Psicossociais (NR-01)",
    modulo: "Psicossocial",
    categoria: "Operação",
    rota: "/psicossocial",
    perfis: ["Administrador", "Técnico de Segurança", "RH"],
    resumo: "Avaliação dos Fatores de Risco Psicossociais (FRPRT) exigida pela NR-01, por questionário anônimo (COPSOQ II-Br), com resultado por GHE integrado ao Inventário do PGR e relatório PDF.",
    secoes: [
      { titulo: "Para que serve e base legal", blocos: [
        { tipo: "paragrafo", texto: "Desde 26/05/2026, a NR-01 (Portaria MTE 1.419/2024) obriga identificar, avaliar e tratar os riscos psicossociais no GRO/PGR. O módulo aplica um questionário validado, calcula o risco por GHE e gera evidência defensável." },
        { tipo: "atencao", texto: "A avaliação mede CONDIÇÕES de trabalho (estressores), não sintomas individuais. As respostas são anônimas e os resultados só aparecem agregados por GHE (mínimo de respondentes), conforme a LGPD." },
      ] },
      { titulo: "Pré-requisito: GHEs no PGR", blocos: [
        { tipo: "paragrafo", texto: "A campanha avalia os GHEs de um PGR. Cadastre os GHEs no módulo PGR antes de criar a campanha (cada GHE com código, descrição e nº de expostos)." },
        { tipo: "dica", texto: "GHE = Grupo Homogêneo de Exposição: agrupa funções com condições semelhantes (ex.: 'Pedreiros — Obra A'). É a unidade de análise e de anonimato." },
      ] },
      { titulo: "Passo a passo completo", blocos: [
        { tipo: "passos", itens: [
          "Em Psicossocial (NR-01) → 'Nova campanha'.",
          "Escolha o PGR (obra), título, versão (curta para frentes de obra) e data de início.",
          "Na campanha, clique em 'Gerar/atualizar links por GHE' (um link/QR anônimo por GHE).",
          "Clique em 'Abrir para respostas' (Rascunho → Aberta).",
          "Distribua o link/QR de cada GHE (cartaz, QR no canteiro, WhatsApp, tablet).",
          "Acompanhe a adesão (respostas por GHE) sem identificar quem respondeu.",
          "'Encerrar' e 'Calcular resultados' → veja o mapa de calor (GHE × dimensão).",
          "'Lançar no Inventário do PGR' (riscos médio/alto) e baixe o 'Relatório PDF'.",
        ] },
      ] },
      { titulo: "Interpretação", blocos: [
        { tipo: "campos", itens: [
          { campo: "Verde (0–33)", descricao: "Risco baixo — condição favorável." },
          { campo: "Amarelo (34–66)", descricao: "Risco médio — requer atenção." },
          { campo: "Vermelho (67–100)", descricao: "Risco alto — prioridade de ação." },
        ] },
      ] },
      { titulo: "Cenários e cuidados", blocos: [
        { tipo: "cenario", situacao: "um GHE tem menos de 5 respostas", orientacao: "o resultado é suprimido (anonimato). Reforce a comunicação para aumentar a adesão antes de calcular." },
        { tipo: "cenario", situacao: "o link mostra 'pesquisa indisponível'", orientacao: "verifique se a campanha está 'Aberta' — em Rascunho/Encerrada/Analisada o link não recebe respostas (comportamento correto)." },
        { tipo: "cenario", situacao: "precisa coletar mais respostas após analisar", orientacao: "no piloto não há reabertura; crie uma nova campanha e oriente a participação antes de calcular." },
        { tipo: "atencao", texto: "Comunique a campanha previamente (passo recomendado pelo Guia do MTE) e garanta ambiente de confiança — a qualidade do dado depende da adesão honesta." },
      ] },
    ],
  },
]

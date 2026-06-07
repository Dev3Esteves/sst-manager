import type { Manual } from "../tipos"

/**
 * Manuais dos módulos de SGSST / ISO 45001 (programa de aderência).
 * Cada módulo evidencia uma cláusula da ISO 45001:2018, com exemplos de uso.
 */
export const manuaisSgsstIso: Manual[] = [
  {
    slug: "politica-sst",
    titulo: "Política de SST",
    modulo: "Política de SST",
    categoria: "Operação",
    rota: "/politica",
    perfis: ["Administrador", "Engenheiro de Segurança", "Diretoria"],
    resumo: "Documento de política de SST versionado (ISO 45001 5.2), com os compromissos exigidos, aprovação da direção, publicação e registro de ciência dos trabalhadores.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "A política declara os compromissos da organização com a SST e dá a direção para os objetivos. Atende à cláusula 5.2 da ISO 45001." },
        { tipo: "checklist", itens: [
          "Condições de trabalho seguras e saudáveis",
          "Cumprir requisitos legais (NRs) e outros",
          "Eliminar perigos e reduzir riscos",
          "Melhorar continuamente o SGSST",
          "Consulta e participação dos trabalhadores",
        ] },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Crie uma revisão em /politica (texto-modelo já preenchido).",
          "Marque os compromissos cobertos e informe a aprovação da direção.",
          "Clique em 'Publicar' para tornar a revisão vigente (substitui a anterior).",
          "Os trabalhadores leem e clicam em 'Declarar ciência' — fica registrada a comunicação.",
        ] },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Primeira política da empresa", texto: "A direção aprova a política em reunião de 02/06. Você cria a revisão 1, marca os 5 compromissos, informa 'Aprovada pela diretoria em 02/06/2026' e publica. No mural e no DDS, os encarregados pedem que cada trabalhador entre em /politica e clique em 'Declarar ciência'. Em duas semanas, 92% declararam — o número aparece no topo da política." },
        { tipo: "cenario", situacao: "A política mudou (ex.: incluiu compromisso com saúde mental).", orientacao: "Crie uma NOVA revisão (revisão 2) em vez de editar a vigente. Ao publicar, a revisão 1 vira histórico e a ciência é solicitada novamente." },
        { tipo: "atencao", texto: "Publicar substitui a revisão vigente. O histórico das revisões anteriores é preservado para auditoria — nunca é apagado." },
        { tipo: "faq", itens: [
          { p: "Posso ter duas políticas publicadas ao mesmo tempo?", r: "Não. Só uma revisão fica vigente; publicar uma nova arquiva a anterior." },
          { p: "Quem precisa declarar ciência?", r: "Todos os trabalhadores. O percentual de ciência é o indicador de comunicação da política (5.2/7.4)." },
        ] },
      ] },
    ],
  },
  {
    slug: "gestao-mudanca",
    titulo: "Gestão de Mudança (MOC)",
    modulo: "Gestão de Mudança",
    categoria: "Operação",
    rota: "/gestao-mudanca",
    perfis: ["Administrador", "Engenheiro de Segurança", "Técnico de Segurança"],
    resumo: "Gerencia mudanças (temporárias/permanentes) avaliando riscos de SST antes de implementar (ISO 45001 8.1.3/8.1.4), incluindo a dimensão humana (ADKAR).",
    secoes: [
      { titulo: "Como usar", blocos: [
        { tipo: "passos", itens: [
          "Cadastre a mudança (tipo, caráter, motivo).",
          "Antes de implementar: identifique perigos/riscos e avalie os controles.",
          "Comunique às partes; implemente; monitore (consequências não intencionais).",
          "Planeje a mudança nas pessoas pelo ADKAR (consciência → reforço).",
        ] },
        { tipo: "dica", texto: "Marque 'envolve aquisição' para registrar os critérios de SST na compra/contratação (8.1.4)." },
      ] },
      { titulo: "Campos", blocos: [
        { tipo: "campos", itens: [
          { campo: "Tipo", descricao: "Processo, equipamento, layout, pessoas, fornecedor, legal...", obrigatorio: true },
          { campo: "Caráter", descricao: "Temporário ou permanente." },
          { campo: "Riscos identificados", descricao: "Novos perigos que a mudança introduz e os controles." },
          { campo: "ADKAR", descricao: "Consciência, Desejo, Conhecimento, Habilidade e Reforço — o lado humano da mudança." },
        ] },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Troca de solvente na pintura", texto: "A produção quer trocar o solvente por um de secagem mais rápida (mudança de processo, permanente). Antes de implementar você registra: novo risco de inflamabilidade e exposição respiratória; controles = ventilação reforçada + respirador com filtro adequado + revisão da FISPQ. No ADKAR: 'Conhecimento' = treinar a equipe no novo manuseio; 'Reforço' = inspeção semanal nas primeiras 4 semanas. Como envolve compra, marca 'envolve aquisição' e registra o critério de SST exigido do fornecedor." },
        { tipo: "cenario", situacao: "Mudança urgente já aconteceu no campo sem avaliação.", orientacao: "Registre mesmo assim (retroativa), avalie as consequências não intencionais e, se gerou risco não controlado, abra uma não-conformidade." },
        { tipo: "faq", itens: [
          { p: "Toda mudança precisa de MOC?", r: "As que podem afetar a SST: processo, equipamento, layout, insumos, equipe-chave, requisitos legais. Pequenos ajustes sem impacto em risco não precisam." },
        ] },
      ] },
    ],
  },
  {
    slug: "contexto-sgsst",
    titulo: "Contexto e partes interessadas",
    modulo: "Contexto",
    categoria: "Operação",
    rota: "/contexto",
    perfis: ["Administrador", "Engenheiro de Segurança", "Diretoria"],
    resumo: "Registro das questões internas/externas (4.1), das partes interessadas e seus requisitos (4.2) e do escopo do SGSST (4.3/4.4).",
    secoes: [
      { titulo: "O que registrar", blocos: [
        { tipo: "campos", itens: [
          { campo: "Questões de contexto", descricao: "Internas/externas que afetam o SGSST." },
          { campo: "Partes interessadas", descricao: "Quem é relevante + necessidades e requisitos." },
          { campo: "Escopo do SGSST", descricao: "Limites, aplicabilidade e exclusões justificadas." },
        ] },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Montando o contexto de uma construtora", texto: "Questão externa: 'clientes exigem certificação ISO 45001 em licitações' (oportunidade). Questão interna: 'alta rotatividade de ajudantes' (ameaça à competência em SST). Parte interessada: 'Sindicato da construção' → requisito: cumprir a convenção coletiva sobre EPIs. Escopo: 'SGSST aplica-se às obras de edificação no estado de SP; exclui-se a fabricação de pré-moldados (terceirizada)'." },
        { tipo: "cenario", situacao: "A empresa entrou num novo segmento (ex.: obras industriais).", orientacao: "Revise as questões de contexto e o escopo: novos riscos, novos requisitos legais e novas partes interessadas (ex.: cliente industrial com regras próprias)." },
        { tipo: "dica", texto: "Releia o contexto na Análise crítica pela direção (9.3) — ele é entrada obrigatória dessa reunião." },
      ] },
    ],
  },
  {
    slug: "analise-critica",
    titulo: "Análise crítica pela direção",
    modulo: "Análise Crítica",
    categoria: "Operação",
    rota: "/analise-critica",
    perfis: ["Administrador", "Diretoria", "Engenheiro de Segurança"],
    resumo: "Registro das análises críticas do SGSST pela direção (ISO 45001 9.3): entradas (desempenho, NCs, auditorias, requisitos) e saídas (conclusões e decisões).",
    secoes: [
      { titulo: "Como conduzir", blocos: [
        { tipo: "paragrafo", texto: "Registre a reunião, as entradas consideradas, o resumo do desempenho e as decisões. As saídas alimentam objetivos, recursos e melhoria contínua." },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Análise crítica semestral", texto: "Reunião de 30/06 com diretoria e engenheiro. Entradas: TF caiu de 12 para 8; 3 não-conformidades de auditoria (2 fechadas); 95% dos ASOs em dia; objetivo de DDS atingido. Saídas (decisões): aprovar verba para 2 novos chuveiros lava-olhos; criar objetivo de reduzir TF para 5 no 2º semestre; reforçar treinamento de NR-35. Tudo fica registrado com data e responsáveis." },
        { tipo: "checklist", itens: [
          "Status das ações da análise crítica anterior",
          "Mudanças no contexto e partes interessadas",
          "Desempenho de SST (indicadores, incidentes, NCs)",
          "Resultados de auditorias e do atendimento legal",
          "Consulta/participação e oportunidades de melhoria",
        ] },
        { tipo: "atencao", texto: "Análise crítica sem decisões registradas não evidencia a 9.3. Sempre conclua com 'o que foi decidido, por quem e até quando'." },
      ] },
    ],
  },
  {
    slug: "requisitos-legais",
    titulo: "Requisitos legais",
    modulo: "Requisitos legais",
    categoria: "Referências",
    rota: "/requisitos-legais",
    perfis: ["Administrador", "Engenheiro de Segurança", "Técnico de Segurança"],
    resumo: "Registro dos requisitos legais aplicáveis (NRs, leis) com avaliação de atendimento (ISO 45001 6.1.3 / 9.1.2).",
    secoes: [
      { titulo: "Como usar", blocos: [
        { tipo: "passos", itens: [
          "Cadastre cada requisito aplicável (referência, título, aplicabilidade).",
          "Avalie o atendimento (atende / não atende / não avaliado) e registre a evidência.",
          "Requisitos 'não atendidos' devem virar não-conformidade.",
        ] },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Avaliando a NR-35 (trabalho em altura)", texto: "Requisito: 'NR-35 — capacitação de trabalho em altura, validade 2 anos'. Aplicabilidade: 'montadores e eletricistas'. Avaliação: 'Atende parcialmente — 18 de 22 trabalhadores com capacitação válida'. Evidência: matriz de treinamentos. Como não está 100%, você abre uma NC para capacitar os 4 pendentes antes de liberá-los para a atividade." },
        { tipo: "cenario", situacao: "Saiu uma atualização de NR.", orientacao: "Atualize o requisito (nova redação/validade), reavalie o atendimento e, se a empresa ficou em desacordo, registre a NC e o plano para se adequar." },
        { tipo: "faq", itens: [
          { p: "Preciso cadastrar todas as NRs?", r: "Só as aplicáveis às suas atividades. Use a aplicabilidade para deixar claro a quem cada uma se refere." },
        ] },
      ] },
    ],
  },
  {
    slug: "objetivos-sst",
    titulo: "Objetivos e metas de SST",
    modulo: "Objetivos",
    categoria: "Operação",
    rota: "/objetivos",
    perfis: ["Administrador", "Engenheiro de Segurança", "Diretoria"],
    resumo: "Objetivos de SST mensuráveis, coerentes com a política (ISO 45001 6.2): indicador, meta, linha de base, prazo, responsável e recursos.",
    secoes: [
      { titulo: "Boas práticas", blocos: [
        { tipo: "dica", texto: "Use indicadores já existentes (TF/TG, % de conformidade, vencimentos) como meta e acompanhe o valor atual." },
      ] },
      { titulo: "Campos", blocos: [
        { tipo: "campos", itens: [
          { campo: "Indicador", descricao: "O que será medido (ex.: taxa de frequência de acidentes)." , obrigatorio: true },
          { campo: "Linha de base", descricao: "Valor atual no início (ponto de partida)." },
          { campo: "Meta", descricao: "Valor a alcançar e até quando.", obrigatorio: true },
          { campo: "Responsável / recursos", descricao: "Quem conduz e do que precisa." },
        ] },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Objetivo SMART de redução de acidentes", texto: "Indicador: Taxa de Frequência (TF). Linha de base: 8 (1º semestre). Meta: ≤ 5 até 31/12/2026. Responsável: Engenheiro de Segurança. Recursos: campanha de DDS quinzenal + 2 inspeções/mês. O valor atual é acompanhado mês a mês; se não evoluir, vira pauta da análise crítica." },
        { tipo: "padrao", recomendado: "Reduzir a TF de 8 para ≤5 até dez/2026 (mensurável, com prazo).", evitar: "Melhorar a segurança da obra (vago, sem como medir)." },
      ] },
    ],
  },
  {
    slug: "plano-emergencia",
    titulo: "Plano de emergência",
    modulo: "Plano de Emergência",
    categoria: "Operação",
    rota: "/plano-emergencia",
    perfis: ["Administrador", "Engenheiro de Segurança", "Técnico de Segurança", "Encarregado de Campo"],
    resumo: "Cenários de emergência com procedimento de resposta, recursos/brigada, contatos, simulados e revisão (ISO 45001 8.2).",
    secoes: [
      { titulo: "O que cadastrar", blocos: [
        { tipo: "campos", itens: [
          { campo: "Cenário", descricao: "Incêndio, vazamento, choque, evacuação, etc." },
          { campo: "Procedimento de resposta", descricao: "Passos, acionamento, ponto de encontro." },
          { campo: "Recursos / brigada / contatos", descricao: "Extintores, kit, SAMU/Bombeiros, brigada." },
          { campo: "Simulados", descricao: "Último/próximo simulado e lições aprendidas." },
        ] },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Cenário de incêndio no canteiro", texto: "Cenário: 'Princípio de incêndio no almoxarifado de inflamáveis'. Procedimento: acionar alarme → brigada combate com extintor PQS → não controlado em 1 min, evacuar pela rota A até o ponto de encontro (portão) → ligar 193. Recursos: 4 extintores PQS, brigada de 6 (lista anexa), contatos Bombeiros/SAMU. Simulado: último em 10/05, próximo em 10/11; lição aprendida: melhorar a sinalização da rota." },
        { tipo: "cenario", situacao: "A obra mudou de fase (ex.: começou a usar empilhadeira a gás).", orientacao: "Revise os cenários: inclua 'vazamento de GLP' com procedimento próprio e atualize a brigada/recursos." },
        { tipo: "atencao", texto: "Plano sem simulado é só papel. Registre cada simulado e as lições aprendidas — é o que comprova a eficácia (8.2)." },
      ] },
    ],
  },
  {
    slug: "auditorias-internas",
    titulo: "Auditorias internas",
    modulo: "Auditorias",
    categoria: "Relatórios",
    rota: "/auditorias",
    perfis: ["Administrador", "Engenheiro de Segurança", "Técnico de Segurança"],
    resumo: "Programa e execução de auditorias internas do SGSST (ISO 45001 9.2) com escopo, critérios, auditor e constatações.",
    secoes: [
      { titulo: "Como usar", blocos: [
        { tipo: "passos", itens: [
          "Crie a auditoria (escopo, critérios, auditor, datas).",
          "Na tela da auditoria, registre as constatações (conformidade, NC, observação, oportunidade).",
          "Não-conformidades devem ser tratadas no módulo de Não-Conformidades.",
        ] },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Auditoria do processo de EPIs", texto: "Escopo: 'gestão de EPIs na Obra Centro'. Critérios: 'NR-06 + procedimento interno PR-07'. Auditor: técnico de segurança de outra obra (independência). Constatações: 1 conformidade (fichas assinadas em dia), 1 NC ('3 CAs vencidos em uso'), 1 oportunidade ('digitalizar a entrega no app'). A NC vira registro em Não-Conformidades com ação corretiva e prazo." },
        { tipo: "dica", texto: "O auditor não deve auditar o próprio trabalho. Use alguém de outra obra/área para garantir a imparcialidade exigida pela 9.2." },
        { tipo: "faq", itens: [
          { p: "Qual a diferença entre observação e não-conformidade?", r: "NC = requisito descumprido (precisa de ação corretiva). Observação = ponto de atenção que ainda não é descumprimento. Oportunidade = sugestão de melhoria." },
        ] },
      ] },
    ],
  },
  {
    slug: "comunicacao-consulta",
    titulo: "Comunicação e consulta",
    modulo: "Comunicação",
    categoria: "Operação",
    rota: "/comunicacao",
    perfis: ["Administrador", "Engenheiro de Segurança", "Técnico de Segurança", "Encarregado de Campo"],
    resumo: "Registro de comunicações internas/externas (7.4) e de eventos de consulta e participação dos trabalhadores (5.4).",
    secoes: [
      { titulo: "Como usar", blocos: [
        { tipo: "paragrafo", texto: "Registre cada comunicação ou consulta com data, tipo, assunto, público-alvo, canal e responsável — formando o histórico exigido pela ISO 45001." },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Consulta sobre novo procedimento", texto: "Tipo: 'Consulta e participação'. Assunto: 'Revisão do procedimento de bloqueio (LOTO)'. Público: 'eletricistas e mantenedores'. Canal: 'reunião + formulário'. Descrição: 'a equipe sugeriu cadeados individuais nominais; aceito e incorporado ao procedimento'. Responsável: engenheiro. Isso evidencia a participação dos trabalhadores (5.4)." },
        { tipo: "cenario", situacao: "Comunicação externa de um acidente ao órgão competente.", orientacao: "Tipo 'Comunicação externa', público 'órgão/seguradora', canal 'ofício/e-mail', com a data — guarda a evidência do cumprimento do dever de comunicar." },
        { tipo: "padrao", recomendado: "Consulta sobre LOTO — eletricistas — reunião 12/06 — sugestões acatadas (cadeado nominal).", evitar: "Reunião de segurança (sem assunto, público ou resultado)." },
      ] },
    ],
  },
]

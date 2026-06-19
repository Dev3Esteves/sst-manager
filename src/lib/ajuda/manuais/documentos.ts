import type { Manual } from "../tipos"

export const manuaisDocumentos: Manual[] = [
  {
    slug: "documentos",
    titulo: "Documentos SST (visão geral)",
    modulo: "Documentos",
    categoria: "Documentos",
    rota: "/documentos",
    perfis: ["Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Central de emissão de documentos: APR, Permissões de Trabalho (PT), Autorizações NR-10/33/35 e Ordem de Serviço NR-01 por função. Todos geram PDF e ficam registrados.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Reúne os documentos técnicos de segurança. Cada tipo tem um formulário próprio e gera um PDF padronizado, que pode ser baixado novamente a qualquer momento." },
        { tipo: "campos", itens: [
          { campo: "OS NR-01", descricao: "Ordem de Serviço por função, emitida em lote para os colaboradores de um cargo numa obra." },
          { campo: "APR", descricao: "Análise Preliminar de Risco (matriz 5×5)." },
          { campo: "Autorizações NR-10/33/35", descricao: "Validam ASO e treinamento antes de autorizar a atividade." },
          { campo: "PT", descricao: "Permissão de Trabalho (altura, confinado, quente, elétrico) com checklist." },
        ] },
      ] },
      { titulo: "Dica", blocos: [
        { tipo: "dica", texto: "Para emitir em massa por função, use a OS NR-01 ou a geração em lote — o sistema percorre os colaboradores da função e gera um documento por pessoa." },
      ] },
    ],
  },
  {
    slug: "apr",
    titulo: "APR — Análise Preliminar de Risco",
    modulo: "Documentos",
    categoria: "Documentos",
    rota: "/documentos/apr/new",
    perfis: ["Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Documento que antecede a tarefa: identifica perigos, avalia o risco (matriz 5×5), define medidas de controle e EPIs. Inclui padrões de escrita para cada campo.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "A APR estrutura, antes de iniciar a atividade, quais perigos existem, qual a severidade/probabilidade de cada um e quais medidas reduzem o risco. É documento de prevenção e de evidência." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Documentos SST → Novo → APR.",
          "Preencha identificação (local, data, responsável, equipe).",
          "Para cada risco: atividade, perigo, severidade × probabilidade.",
          "Defina a medida de controle e o responsável.",
          "Liste os EPIs obrigatórios e emita.",
        ] },
      ] },
      { titulo: "Campos", blocos: [
        { tipo: "campos", itens: [
          { campo: "Atividade", descricao: "A tarefa concreta que será executada.", obrigatorio: true },
          { campo: "Perigo", descricao: "A fonte do dano (não o dano em si).", obrigatorio: true },
          { campo: "Severidade × Probabilidade", descricao: "Classificação na matriz 5×5.", obrigatorio: true },
          { campo: "Medida de controle", descricao: "Ação concreta que elimina ou reduz o risco.", obrigatorio: true },
          { campo: "Responsável", descricao: "Quem garante a medida (função, não 'todos')." },
        ] },
      ] },
      { titulo: "Padrões de escrita — Perigo", blocos: [
        { tipo: "paragrafo", texto: "Descreva o PERIGO (a fonte), não a consequência. Seja específico sobre a fonte de energia/agente." },
        { tipo: "padrao", recomendado: "Trabalho em altura acima de 2 m em borda de laje sem guarda-corpo", evitar: "Cair / perigo de queda" },
        { tipo: "padrao", recomendado: "Contato com partes energizadas em painel de 380 V durante manutenção", evitar: "Choque elétrico" },
      ] },
      { titulo: "Padrões de escrita — Medida de controle", blocos: [
        { tipo: "paragrafo", texto: "A medida deve ser uma AÇÃO verificável, seguindo a hierarquia de controles (eliminar > engenharia > administrativa > EPI)." },
        { tipo: "padrao", recomendado: "Instalar guarda-corpo provisório (1,20 m) em todo o perímetro da laje antes do início do serviço", evitar: "Ter cuidado / usar EPI / atenção redobrada" },
        { tipo: "cenario", situacao: "o risco não pode ser eliminado", orientacao: "combine controles: engenharia + administrativa + EPI, e descreva cada um — nunca dependa só do EPI." },
      ] },
    ],
  },
  {
    slug: "pt",
    titulo: "PT — Permissão de Trabalho",
    modulo: "Documentos",
    categoria: "Documentos",
    rota: "/documentos/pt/new",
    perfis: ["Técnico de Segurança", "Supervisor"],
    resumo: "Permissão para tarefas de alto risco (altura, espaço confinado, trabalho a quente, serviço elétrico) com checklist que libera — ou não — o início do trabalho.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "A PT garante que as condições de segurança foram verificadas antes de liberar uma tarefa crítica. Cada tipo tem um checklist específico (NR-35, NR-33, trabalho a quente, NR-10)." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Documentos SST → Novo → PT (escolha o tipo: altura, confinado, quente ou elétrico).",
          "Informe local e descrição da tarefa.",
          "Percorra o checklist marcando cada item como conforme.",
          "Se houver pendências, descreva-as. A PT pode ser registrada, mas só libera o trabalho com todos os itens conformes.",
          "Emita.",
        ] },
      ] },
      { titulo: "Cenários", blocos: [
        { tipo: "cenario", situacao: "um item do checklist está pendente", orientacao: "não libere o trabalho — descreva a pendência e resolva antes. A PT registra o status, mas a liberação exige tudo conforme." },
        { tipo: "atencao", texto: "A PT tem validade limitada (geralmente o turno/tarefa). Reavalie as condições a cada nova jornada ou mudança de equipe." },
      ] },
    ],
  },
  {
    slug: "autorizacoes-nr",
    titulo: "Autorizações NR-10 / NR-33 / NR-35",
    modulo: "Documentos",
    categoria: "Documentos",
    rota: "/documentos/autorizacao-nr/new",
    perfis: ["Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Autoriza o trabalhador a executar atividades reguladas (eletricidade, espaço confinado, altura), validando aptidão médica (ASO) e treinamento correspondente.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "A autorização formaliza que o trabalhador está apto e treinado para a atividade regulada. O sistema valida ASO e o treinamento da NR antes de emitir." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Documentos SST → Novo → Autorização (escolha a NR: 10, 33 ou 35).",
          "Selecione o colaborador — o sistema verifica ASO válido e treinamento da NR.",
          "Se faltar algum requisito, regularize antes (exame ou treinamento).",
          "Emita a autorização.",
        ] },
      ] },
      { titulo: "Cenários", blocos: [
        { tipo: "cenario", situacao: "o trabalhador não tem o treinamento da NR registrado", orientacao: "registre a realização do treinamento primeiro (módulo Treinamentos); depois emita a autorização." },
      ] },
    ],
  },
  {
    slug: "os-nr01",
    titulo: "Ordem de Serviço NR-01 (por função)",
    modulo: "Documentos",
    categoria: "Documentos",
    rota: "/documentos/os-nr01/new",
    perfis: ["Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Emite a OS NR-01 em lote para todos os colaboradores de uma função alocados numa obra, pré-preenchendo riscos e EPIs a partir do cadastro do cargo.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "A NR-01 exige a Ordem de Serviço informando riscos e medidas por função. Aqui você emite de uma vez para toda a função numa obra — uma página por colaborador." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Documentos SST → OS NR-01.",
          "Escolha a empresa própria, a função (cargo) e a obra.",
          "O sistema pré-preenche riscos e EPIs obrigatórios/eventuais do cargo.",
          "Revise e gere — o PDF traz uma página por colaborador da função alocado na obra.",
        ] },
      ] },
      { titulo: "Pré-requisito", blocos: [
        { tipo: "atencao", texto: "A qualidade da OS depende do cadastro do Cargo (riscos e EPIs). Configure bem o cargo antes de emitir." },
        { tipo: "dica", texto: "Para lotes grandes (>10 colaboradores), use o envio para a fila de jobs — a geração roda em segundo plano e você baixa o ZIP quando pronto." },
      ] },
    ],
  },
]

import type { Manual } from "../tipos"

export const manuaisCadastros: Manual[] = [
  {
    slug: "empresas",
    titulo: "Empresas",
    modulo: "Empresas",
    categoria: "Cadastros",
    rota: "/empresas",
    perfis: ["Administrador", "RH"],
    resumo:
      "Cadastro das empresas: as próprias (que a Organização opera) e os parceiros (clientes/contratantes e prestadoras). Define quais empresas são contextos operáveis e a relação entre elas.",
    secoes: [
      {
        titulo: "Para que serve",
        blocos: [
          { tipo: "paragrafo", texto: "Cada empresa própria é um contexto operacional com dados isolados — é uma empresa que a Organização opera e pode ativar no seletor do topo. Os parceiros (contratantes onde se executa obras e prestadoras que prestam serviço) são registros de negócio gerenciados, nunca contextos operáveis." },
          {
            tipo: "campos",
            itens: [
              { campo: "Empresa própria", descricao: "Empresa que a Organização opera. Hospeda colaboradores, documentos e relatórios, e pode ser ativada como contexto no seletor." },
              { campo: "Contratante (parceiro)", descricao: "Cliente onde uma empresa própria executa obras." },
              { campo: "Prestadora (parceiro)", descricao: "Empresa que presta serviço; pode ser vinculada a uma empresa própria responsável." },
            ],
          },
        ],
      },
      {
        titulo: "Passo a passo",
        blocos: [
          { tipo: "passos", itens: [
            "Acesse Empresas e clique em 'Nova empresa'.",
            "Informe razão social, CNPJ e a classificação (própria/contratante/prestadora).",
            "Se for uma empresa que a Organização opera, marque-a como 'própria'.",
            "Se for parceiro (prestadora/contratante), vincule a empresa própria responsável (opcional).",
            "Envie o logo (aparece nos certificados e documentos emitidos).",
            "Salve.",
          ] },
        ],
      },
      {
        titulo: "Campos",
        blocos: [
          { tipo: "campos", itens: [
            { campo: "Razão social", descricao: "Nome jurídico completo.", obrigatorio: true },
            { campo: "CNPJ", descricao: "Validado com dígitos verificadores.", obrigatorio: true },
            { campo: "Nome fantasia", descricao: "Nome comercial (opcional)." },
            { campo: "Classificação", descricao: "própria / contratante / terceira.", obrigatorio: true },
            { campo: "Logo", descricao: "PNG/JPG/WebP até 2 MB; usado no cabeçalho dos documentos." },
          ] },
        ],
      },
      {
        titulo: "Erros comuns e dúvidas",
        blocos: [
          { tipo: "atencao", texto: "Não cadastre a mesma empresa duas vezes com CNPJ diferente. Para corrigir dados, edite o registro existente." },
          { tipo: "faq", itens: [
            { p: "Posso ter mais de uma empresa própria?", r: "Sim, e cada uma terá seus dados isolados. Todas as próprias aparecem no seletor de empresa ativa para quem tiver vínculo." },
            { p: "O que muda ao marcar uma empresa como 'própria'?", r: "Ela passa a hospedar colaboradores, obras e documentos, e pode ser ativada como contexto operacional no seletor do topo. Parceiros nunca podem." },
          ] },
        ],
      },
    ],
  },
  {
    slug: "obras",
    titulo: "Obras",
    modulo: "Obras",
    categoria: "Cadastros",
    rota: "/obras",
    perfis: ["Administrador", "Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Projetos/canteiros em andamento. A obra conecta a empresa própria, a contratante e os colaboradores alocados, e é a base do PGR e das emissões por obra.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "A obra representa um canteiro/projeto. É referência para alocar colaboradores, emitir Ordem de Serviço NR-01 por função, montar o PGR e as campanhas psicossociais." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Em Obras, clique em 'Nova obra'.",
          "Informe o nome, a contratante (cliente) e a localização (cidade/UF).",
          "Preencha o CNO (Cadastro Nacional de Obras) e o nº máximo de empregados, se já souber — entram no cabeçalho do PGR.",
          "Salve e aloque os colaboradores na obra pelo cadastro de colaboradores.",
        ] },
      ] },
      { titulo: "Campos", blocos: [
        { tipo: "campos", itens: [
          { campo: "Nome", descricao: "Identificação da obra (ex.: DANTE / RACIONAL).", obrigatorio: true },
          { campo: "Contratante", descricao: "Empresa cliente onde a obra acontece." },
          { campo: "CNO", descricao: "Cadastro Nacional de Obras (Receita Federal), formato XX.XXX.XXXXX/XX — usado no eSocial e no PGR." },
          { campo: "Nº de empregados (máx.)", descricao: "Pico de trabalhadores alocados; aparece no cabeçalho do PGR." },
        ] },
      ] },
      { titulo: "Dicas", blocos: [
        { tipo: "dica", texto: "Mantenha o CNO e o nº de empregados atualizados antes de gerar o PGR — eles são copiados para o documento no momento da emissão." },
      ] },
    ],
  },
  {
    slug: "cargos",
    titulo: "Cargos / Funções",
    modulo: "Cargos",
    categoria: "Cadastros",
    rota: "/cargos",
    perfis: ["Administrador", "Técnico de Segurança", "RH"],
    resumo: "Funções da organização com seus riscos associados e EPIs obrigatórios/eventuais. Alimenta automaticamente a OS NR-01, a Ficha de EPI e o PGR.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Ao configurar riscos e EPIs por cargo, o sistema pré-preenche documentos (OS NR-01, Ficha de EPI) para todos os colaboradores daquela função, evitando retrabalho e divergências." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Em Cargos, crie a função com nome e CBO.",
          "Defina o grupo de risco (quando aplicável).",
          "Liste os riscos associados à função.",
          "Adicione os EPIs obrigatórios (sempre) e eventuais (conforme atividade), com observação quando necessário.",
        ] },
      ] },
      { titulo: "Padrões de escrita — riscos e EPIs", blocos: [
        { tipo: "padrao", recomendado: "EPI obrigatório: Luva isolante de borracha Classe 2 (até 17 kV) — observação: 'para serviços em MT'", evitar: "Luva" },
        { tipo: "cenario", situacao: "o EPI só é usado em uma atividade específica", orientacao: "cadastre como 'eventual' e descreva a condição na observação (ex.: 'somente em soldagem')." },
      ] },
      { titulo: "Dicas", blocos: [
        { tipo: "dica", texto: "Capriche neste cadastro: ele é a fonte dos riscos e EPIs que aparecem na OS NR-01 e no inventário do PGR." },
      ] },
    ],
  },
  {
    slug: "colaboradores",
    titulo: "Colaboradores",
    modulo: "Colaboradores",
    categoria: "Cadastros",
    rota: "/colaboradores",
    perfis: ["Administrador", "RH", "Técnico de Segurança"],
    resumo: "Trabalhadores da organização, vinculados a empresa, cargo e obra. Base de exames, treinamentos, entregas de EPI e documentos.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "O colaborador é o centro da operação de SST: a ele se vinculam exames médicos, treinamentos, entregas de EPI (Ficha cumulativa) e autorizações." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Em Colaboradores, clique em 'Novo colaborador'.",
          "Informe nome, CPF, empresa, cargo e obra de alocação.",
          "Salve. A partir daí, registre exames, treinamentos e entregas de EPI para ele.",
          "Use o ícone de Ficha de EPI para emitir o histórico cumulativo de entregas.",
        ] },
      ] },
      { titulo: "Campos", blocos: [
        { tipo: "campos", itens: [
          { campo: "Nome completo", descricao: "Como aparece nos documentos/certificados.", obrigatorio: true },
          { campo: "CPF", descricao: "Validado; chave única do trabalhador.", obrigatorio: true },
          { campo: "Empresa / Cargo / Obra", descricao: "Vínculos que definem riscos, EPIs e onde ele atua." },
        ] },
      ] },
    ],
  },
  {
    slug: "epis",
    titulo: "EPIs e Entregas",
    modulo: "EPIs",
    categoria: "Cadastros",
    rota: "/epis",
    perfis: ["Administrador", "Técnico de Segurança", "Almoxarifado"],
    resumo: "Catálogo de Equipamentos de Proteção Individual (com CA e validade) e o registro de entregas por colaborador, que gera a Ficha de EPI cumulativa (NR-06).",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Cadastra os EPIs com seu Certificado de Aprovação (CA) e validade, e registra cada entrega ao colaborador com assinatura — base para a Ficha de EPI exigida pela NR-06." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Cadastre o EPI com descrição, CA, validade do CA, fabricante e tipo.",
          "Em Entregas, registre a entrega: colaborador, EPI, quantidade, motivo e assinatura (coletada na tela).",
          "Emita a Ficha de EPI do colaborador para ter o histórico completo com o Termo de Responsabilidade.",
        ] },
      ] },
      { titulo: "Cenários de registro", blocos: [
        { tipo: "cenario", situacao: "o trabalhador troca um EPI desgastado", orientacao: "registre nova entrega com motivo 'substituição' / 'desgaste' — o histórico cumulativo preserva as entregas anteriores." },
        { tipo: "cenario", situacao: "o CA do EPI venceu", orientacao: "o módulo de Vencimentos sinaliza; não entregue EPI com CA vencido — atualize o cadastro com o novo CA antes." },
      ] },
      { titulo: "FAQ", blocos: [
        { tipo: "faq", itens: [
          { p: "A assinatura é obrigatória?", r: "É fortemente recomendada — é a evidência da entrega. Pode ser coletada na própria tela (assinatura digital)." },
        ] },
      ] },
    ],
  },
  {
    slug: "treinamentos",
    titulo: "Treinamentos",
    modulo: "Treinamentos",
    categoria: "Cadastros",
    rota: "/treinamentos",
    perfis: ["Administrador", "Técnico de Segurança", "RH"],
    resumo: "Catálogo de treinamentos (NRs) e o registro das realizações por colaborador, que emite o certificado e controla a validade/reciclagem.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Cadastra os treinamentos (com NR de referência, carga horária e validade) e registra quem realizou cada um, emitindo certificado e alimentando a matriz de treinamentos e os vencimentos." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Cadastre o treinamento: título, NR de referência, carga horária, validade (meses) e conteúdo programático.",
          "Em Realizações, registre o colaborador, a data e o instrutor/entidade.",
          "Emita o certificado (PDF). A validade é calculada automaticamente a partir da data e dos meses de validade.",
        ] },
      ] },
      { titulo: "Padrões de escrita — conteúdo programático", blocos: [
        { tipo: "padrao", recomendado: "Riscos elétricos e medidas de controle; Análise de risco e APR; Trabalhos em instalações desenergizadas (NR-10)", evitar: "Conteúdo da norma" },
        { tipo: "dica", texto: "O texto do certificado pode ser padronizado em Configurações (template da empresa) para manter consistência entre todos os certificados." },
      ] },
    ],
  },
]

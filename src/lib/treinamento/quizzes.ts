/**
 * Quizzes da trilha de treinamento (1 por módulo).
 * Concluir um módulo exige acertar o quiz — é a comprovação de que o usuário
 * compreendeu os recursos antes de a trava liberar o uso do módulo.
 * `correta` é o índice (0-based) da opção certa em `opcoes`.
 */
export type QuizPergunta = {
  pergunta: string
  opcoes: string[]
  correta: number
}

export const QUIZZES: Record<string, QuizPergunta[]> = {
  "boas-vindas": [
    {
      pergunta: "Como esta trilha de treinamento funciona?",
      opcoes: [
        "Todos os módulos ficam abertos desde o início, sem ordem.",
        "É sequencial: cada módulo abre após você concluir o anterior.",
        "Só o administrador pode concluir os módulos.",
      ],
      correta: 1,
    },
    {
      pergunta: "O que o SST Manager gerencia?",
      opcoes: ["Segurança e Saúde no Trabalho", "Folha de pagamento", "Estoque de materiais"],
      correta: 0,
    },
  ],
  "multiempresa": [
    {
      pergunta: "O que define a qual empresa um cadastro fica vinculado?",
      opcoes: [
        "A empresa ativa selecionada no momento do cadastro.",
        "Sempre a primeira empresa do grupo.",
        "O usuário escolhe manualmente em cada registro.",
      ],
      correta: 0,
    },
    {
      pergunta: "Um usuário consegue ver os dados de empresas às quais não foi vinculado?",
      opcoes: ["Sim, vê todas", "Não — os dados são isolados por empresa (RLS)", "Só se for engenheiro"],
      correta: 1,
    },
  ],
  "cadastros-base": [
    {
      pergunta: "Ao cadastrar uma obra, o que o sistema cria automaticamente?",
      opcoes: ["Nada", "As áreas 'Interna' e 'Externa'", "Um PGR completo"],
      correta: 1,
    },
    {
      pergunta: "Para que servem os cargos nos cadastros base?",
      opcoes: [
        "Apenas para organização visual.",
        "Definem função, NRs aplicáveis e base das matrizes (EPI e treinamento).",
        "Somente para calcular salários.",
      ],
      correta: 1,
    },
  ],
  "medicos-clinicas": [
    {
      pergunta: "Como o cadastro de médico agiliza o preenchimento?",
      opcoes: ["Buscando pelo CRM e preenchendo o nome", "Sorteando um médico", "Não há automação"],
      correta: 0,
    },
    {
      pergunta: "O endereço da clínica pode ser preenchido a partir de qual dado?",
      opcoes: ["Do nome do médico", "Do CNPJ/CEP (BrasilAPI)", "Da placa do veículo"],
      correta: 1,
    },
  ],
  "exames-aso": [
    {
      pergunta: "Como o vencimento do ASO é definido?",
      opcoes: ["Sempre 12 meses fixos", "Sugerido pela periodicidade do exame", "O usuário nunca informa"],
      correta: 1,
    },
    {
      pergunta: "Qual recurso ajuda a pré-preencher o ASO a partir do documento?",
      opcoes: ["OCR", "Impressão 3D", "Assinatura digital"],
      correta: 0,
    },
  ],
  "epis-nr06": [
    {
      pergunta: "Para que serve a matriz EPI × Cargo?",
      opcoes: [
        "Listar os EPIs obrigatórios por função.",
        "Calcular o preço dos EPIs.",
        "Definir o salário do colaborador.",
      ],
      correta: 0,
    },
    {
      pergunta: "O que é obrigatório no momento da entrega de EPI?",
      opcoes: ["Nada", "Assinatura + termo de ciência", "Apenas uma foto do EPI"],
      correta: 1,
    },
  ],
  "treinamentos": [
    {
      pergunta: "O que a matriz treinamento × cargo define?",
      opcoes: [
        "Os treinamentos obrigatórios por função.",
        "A ordem alfabética dos cursos.",
        "O valor pago ao instrutor.",
      ],
      correta: 0,
    },
    {
      pergunta: "Como registrar um treinamento para vários colaboradores de uma vez?",
      opcoes: ["Um por um, obrigatoriamente", "Pelo registro em lote", "Não é possível"],
      correta: 1,
    },
  ],
  "pgr-gro": [
    {
      pergunta: "Qual a relação entre PGR e Painel GRO?",
      opcoes: [
        "São sistemas independentes e sem ligação.",
        "O GRO é a visão de gestão (PDCA) sobre o PGR.",
        "O PGR substitui o GRO.",
      ],
      correta: 1,
    },
    {
      pergunta: "O que o PGR organiza?",
      opcoes: [
        "GHE, inventário de riscos, plano de ação 5W1H e medidas.",
        "Apenas a folha de pagamento.",
        "Somente os exames médicos.",
      ],
      correta: 0,
    },
  ],
  "psicossocial-sst": [
    {
      pergunta: "Como os resultados psicossociais protegem os respondentes?",
      opcoes: [
        "Mostrando todos os nomes.",
        "Respeitando o anonimato (supressão quando há poucos respondentes).",
        "Não há proteção.",
      ],
      correta: 1,
    },
    {
      pergunta: "O resultado psicossocial alimenta qual instrumento?",
      opcoes: ["O inventário de riscos psicossociais do PGR", "A folha de ponto", "O contracheque"],
      correta: 0,
    },
    {
      pergunta: "Qual tipo de instrumento NÃO é lançado no Inventário do PGR?",
      opcoes: [
        "Os de exposição (COPSOQ, HSE-IT)",
        "Os de desfecho (CBI, DASS-21) — são só monitoramento",
        "Nenhum: todos vão ao PGR",
      ],
      correta: 1,
    },
    {
      pergunta: "Como se chega ao nível de risco NR-1 de um fator de exposição?",
      opcoes: [
        "Só pelo escore do questionário",
        "Probabilidade (do questionário) × severidade (avaliada pelo técnico)",
        "Pelo número de respondentes",
      ],
      correta: 1,
    },
  ],
  "ocorrencias-nc": [
    {
      pergunta: "O que orienta a descrição de uma ocorrência?",
      opcoes: ["Um modelo (template) com os 5 Porquês", "Nada, é texto livre", "Apenas uma foto"],
      correta: 0,
    },
    {
      pergunta: "Uma não-conformidade deve ser tratada com o quê?",
      opcoes: [
        "Ações corretivas com verificação de eficácia.",
        "Apenas arquivamento.",
        "Um aviso por e-mail somente.",
      ],
      correta: 0,
    },
  ],
  "inspecoes-dds": [
    {
      pergunta: "O que é registrado quando há uma não conformidade na inspeção?",
      opcoes: ["Nada", "Uma foto da não conformidade", "Apenas a data"],
      correta: 1,
    },
    {
      pergunta: "No DDS, como agilizar a inclusão de participantes?",
      opcoes: ["Digitando um por um sempre", "Usando 'Selecionar todos'", "Não é possível incluir vários"],
      correta: 1,
    },
  ],
  "documentos-iso": [
    {
      pergunta: "O que a tela de aderência ISO 45001 mostra?",
      opcoes: [
        "Como o sistema cobre as cláusulas 4–10 e os gaps.",
        "A folha de pagamento da equipe.",
        "O estoque de EPIs.",
      ],
      correta: 0,
    },
    {
      pergunta: "Quais documentos o módulo emite?",
      opcoes: ["APR, PT, OS e referências (NRs, Tabela 22 eSocial)", "Apenas notas fiscais", "Somente contratos de trabalho"],
      correta: 0,
    },
  ],
  "governanca-sgsst": [
    {
      pergunta: "Na Gestão de Mudança (MOC), o que deve ser feito antes de implementar a mudança?",
      opcoes: [
        "Avaliar riscos de SST e planejar a dimensão humana (ADKAR).",
        "Nada — basta comunicar depois.",
        "Apenas registrar a data.",
      ],
      correta: 0,
    },
    {
      pergunta: "Qual módulo registra os compromissos da organização e a ciência dos trabalhadores?",
      opcoes: ["Política de SST", "Heatmap de ocorrências", "Fila de jobs"],
      correta: 0,
    },
    {
      pergunta: "A Análise crítica pela direção (9.3) serve para quê?",
      opcoes: [
        "Registrar entradas (desempenho, NCs, auditorias) e as decisões da direção.",
        "Apenas listar usuários.",
        "Gerar certificados.",
      ],
      correta: 0,
    },
  ],
  "estoque-epis": [
    {
      pergunta: "De onde vem a ENTRADA de estoque de um EPI?",
      opcoes: [
        "Da confirmação de uma compra (fornecedor + nota fiscal + custo)",
        "Da entrega ao colaborador",
        "Do cadastro do EPI no catálogo",
      ],
      correta: 0,
    },
    {
      pergunta: "O que acontece no estoque ao ENTREGAR um EPI a um colaborador?",
      opcoes: [
        "Nada — a entrega não afeta o estoque",
        "Dá baixa automática (saída) no local da obra dele",
        "Aumenta o saldo do local",
      ],
      correta: 1,
    },
    {
      pergunta: "Qual método de custo o estoque usa para valorizar saldo e saídas?",
      opcoes: [
        "Custo médio ponderado (recalculado a cada compra)",
        "Sempre o preço da primeira compra",
        "Não controla custo",
      ],
      correta: 0,
    },
  ],
}

export function getQuiz(slug: string): QuizPergunta[] {
  return QUIZZES[slug] ?? []
}

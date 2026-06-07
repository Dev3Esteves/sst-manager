import type { Manual } from "../tipos"

/**
 * Manuais dos módulos de SGSST / ISO 45001 (programa de aderência).
 * Cada módulo evidencia uma cláusula da ISO 45001:2018.
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
    ],
  },
]

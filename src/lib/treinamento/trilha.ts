/**
 * Trilha de treinamento do sistema (in-app, desbloqueio sequencial).
 * Cada módulo só abre após a conclusão do anterior (progresso por usuário em
 * `treinamento_sistema_progresso`). Cobre o ecossistema (multiempresa +
 * integração), o SST (Segurança) e uma visão do People (RH).
 */

export type SecaoTrilha = "Ecossistema" | "SST — Segurança" | "People — RH"

export type ModuloTrilha = {
  slug: string
  ordem: number
  secao: SecaoTrilha
  titulo: string
  objetivo: string
  topicos: string[]
  /** Slugs de manuais relacionados (abrem em /ajuda/<slug>). */
  manuais?: string[]
  /** Atalhos para abrir telas do app. */
  rotas?: { label: string; href: string }[]
  /** Módulo que trata do outro app (People) — conteúdo de visão geral. */
  externo?: boolean
}

export const TRILHA: ModuloTrilha[] = [
  // ───────────────────────── Ecossistema ─────────────────────────
  {
    slug: "boas-vindas", ordem: 1, secao: "Ecossistema",
    titulo: "Boas-vindas e visão geral",
    objetivo: "Entender o que é o ecossistema integrado (People + SST) e como esta trilha funciona.",
    topicos: [
      "O SST Manager cuida da Segurança e Saúde no Trabalho; o People (RH) cuida do RH.",
      "Os dois sistemas conversam: o People envia colaboradores/cargos e consome ASO/EPI/Psicossocial do SST.",
      "Esta trilha é sequencial: cada módulo abre após você concluir o anterior.",
      "Ao final de cada módulo, clique em 'Marcar como concluído' para liberar o próximo.",
    ],
  },
  {
    slug: "multiempresa", ordem: 2, secao: "Ecossistema",
    titulo: "Grupo e empresa ativa (multiempresa)",
    objetivo: "Operar mais de uma empresa do grupo com isolamento de dados.",
    topicos: [
      "O sistema é multiempresa: cada empresa tem seus dados isolados (RLS).",
      "Após o login, selecione a empresa ativa; troque pelo seletor no topo.",
      "Tudo o que você cadastra fica vinculado à empresa ativa do momento.",
      "Seu usuário só vê as empresas às quais foi vinculado.",
    ],
    manuais: ["empresas"],
    rotas: [{ label: "Empresas", href: "/empresas" }],
  },
  {
    slug: "integracao-people-sst", ordem: 3, secao: "Ecossistema",
    titulo: "Integração People ↔ SST",
    objetivo: "Compreender o fluxo de dados entre os dois sistemas.",
    topicos: [
      "People → SST: colaboradores e cargos chegam por webhook (o SST é a base operacional de Segurança).",
      "SST → People: o People lê ASO, EPI e resultados psicossociais por API (o SST é a fonte).",
      "Obras: o SST é o dono; o People concilia seus centros de responsabilidade pelo código da obra.",
      "Evite duplicar cadastros: cada dado tem um sistema 'dono'.",
    ],
    manuais: ["obras-locais"],
  },

  // ───────────────────────── SST — Segurança ─────────────────────────
  {
    slug: "cadastros-base", ordem: 4, secao: "SST — Segurança",
    titulo: "Cadastros base: obras, cargos e colaboradores",
    objetivo: "Montar a fundação: onde se trabalha, em que função e quem.",
    topicos: [
      "Cadastre a obra com CNPJ/endereço (BrasilAPI) e empreitada; ela cria 'Área Interna' e 'Área Externa'.",
      "Adicione locais específicos da obra (subestação, galpão...).",
      "Cargos definem função, NRs aplicáveis e base para as matrizes (EPI e treinamento).",
      "Colaboradores são vinculados a cargo e obra.",
    ],
    manuais: ["obras-locais"],
    rotas: [{ label: "Obras", href: "/obras" }, { label: "Colaboradores", href: "/colaboradores" }],
  },
  {
    slug: "medicos-clinicas", ordem: 5, secao: "SST — Segurança",
    titulo: "Médicos e clínicas",
    objetivo: "Padronizar os responsáveis e locais dos exames ocupacionais.",
    topicos: [
      "Cadastre médicos buscando pelo CRM (preenche nome em Title Case).",
      "Cadastre clínicas com endereço por CNPJ/CEP.",
      "No exame, selecione médico e clínica — os dados ficam gravados no ASO.",
    ],
    manuais: ["medicos", "clinicas"],
    rotas: [{ label: "Médicos", href: "/medicos" }, { label: "Clínicas", href: "/clinicas" }],
  },
  {
    slug: "exames-aso", ordem: 6, secao: "SST — Segurança",
    titulo: "Exames médicos (ASO / PCMSO)",
    objetivo: "Registrar e acompanhar a aptidão ocupacional.",
    topicos: [
      "Registre o ASO com tipo, datas e resultado; o vencimento é sugerido pela periodicidade.",
      "Use o OCR para pré-preencher a partir do documento.",
      "Acompanhe os vencimentos no painel e em Vencimentos.",
    ],
    rotas: [{ label: "Exames", href: "/exames" }],
  },
  {
    slug: "epis-nr06", ordem: 7, secao: "SST — Segurança",
    titulo: "EPIs e matriz EPI × Cargo (NR-06)",
    objetivo: "Definir EPIs obrigatórios por função e controlar entrega/devolução.",
    topicos: [
      "Cadastre o catálogo de EPIs (CA, validade).",
      "Monte a matriz EPI×Cargo para listar os obrigatórios por função.",
      "Na entrega, colete assinatura + termo de ciência (obrigatórios).",
      "Registre a devolução quando aplicável.",
    ],
    manuais: ["epi-matriz"],
    rotas: [{ label: "EPIs", href: "/epis" }, { label: "Matriz EPI×Cargo", href: "/epis/matriz" }],
  },
  {
    slug: "treinamentos", ordem: 8, secao: "SST — Segurança",
    titulo: "Treinamentos: catálogo, matriz e lote",
    objetivo: "Planejar treinamentos obrigatórios e registrar em escala.",
    topicos: [
      "Cadastre instrutores e entidades de treinamento.",
      "Defina a matriz treinamento×cargo (obrigatórios por função).",
      "Registre realizações individualmente ou em lote (vários colaboradores de uma vez).",
      "Acompanhe a cobertura na Matriz de Treinamentos (gap analysis).",
    ],
    manuais: ["instrutores", "entidades-treinamento", "treinamento-matriz-lote"],
    rotas: [{ label: "Treinamentos", href: "/treinamentos" }, { label: "Matriz por cargo", href: "/treinamentos/matriz" }],
  },
  {
    slug: "pgr-gro", ordem: 9, secao: "SST — Segurança",
    titulo: "PGR e Painel GRO (NR-01 / PDCA)",
    objetivo: "Gerenciar riscos: do inventário ao acompanhamento PDCA.",
    topicos: [
      "O PGR organiza GHE, inventário de riscos, plano de ação 5W1H e medidas (NIOSH).",
      "O Painel GRO é a visão de gestão (Planejar/Fazer/Verificar/Agir) sobre o PGR.",
      "Use o GRO para enxergar ações em aberto, conformidade e vencimentos.",
    ],
    manuais: ["gro"],
    rotas: [{ label: "PGR", href: "/pgr" }, { label: "Painel GRO", href: "/gro" }],
  },
  {
    slug: "psicossocial-sst", ordem: 10, secao: "SST — Segurança",
    titulo: "Riscos psicossociais (NR-01)",
    objetivo: "Aplicar e ler campanhas psicossociais integradas ao PGR.",
    topicos: [
      "As campanhas avaliam dimensões psicossociais por GHE.",
      "Os resultados respeitam o anonimato (supressão quando há poucos respondentes).",
      "O resultado alimenta o inventário de riscos psicossociais do PGR.",
    ],
    rotas: [{ label: "Psicossocial", href: "/psicossocial" }],
  },
  {
    slug: "ocorrencias-nc", ordem: 11, secao: "SST — Segurança",
    titulo: "Ocorrências e não-conformidades",
    objetivo: "Registrar eventos e tratar causas com ações corretivas.",
    topicos: [
      "Registre ocorrências a partir de um modelo (template) que orienta a descrição e os 5 Porquês.",
      "Abra não-conformidades (de inspeção, auditoria, ocorrência...).",
      "Use 5 Porquês/Ishikawa e ações corretivas com verificação de eficácia.",
    ],
    manuais: ["templates-sst"],
    rotas: [{ label: "Ocorrências", href: "/ocorrencias" }, { label: "Não-Conformidades", href: "/nao-conformidades" }],
  },
  {
    slug: "inspecoes-dds", ordem: 12, secao: "SST — Segurança",
    titulo: "Inspeções e DDS",
    objetivo: "Auditar campo e registrar diálogos de segurança.",
    topicos: [
      "Crie templates de inspeção e execute checklists (com foto em não conformidade).",
      "Use o catálogo de DDS (temas e mediadores) e 'Selecionar todos' os participantes.",
      "Colete assinaturas no próprio dispositivo.",
    ],
    manuais: ["templates-sst", "dds-catalogo"],
    rotas: [{ label: "Inspeções", href: "/inspecoes" }, { label: "DDS", href: "/dds" }],
  },
  {
    slug: "documentos-iso", ordem: 13, secao: "SST — Segurança",
    titulo: "Documentos, referências e ISO 45001",
    objetivo: "Emitir documentos e avaliar a aderência normativa.",
    topicos: [
      "Documentos SST (APR, PT, OS...) e referências (NRs, Tabela 22 eSocial).",
      "A aderência ISO 45001 mostra como o sistema cobre as cláusulas 4–10 e os gaps.",
    ],
    manuais: ["iso-45001"],
    rotas: [{ label: "Documentos", href: "/documentos" }, { label: "ISO 45001", href: "/iso-45001" }],
  },

  {
    slug: "governanca-sgsst", ordem: 14, secao: "SST — Segurança",
    titulo: "Governança do SGSST (ISO 45001)",
    objetivo: "Operar a camada de gestão do sistema de SST exigida pela ISO 45001: contexto, política, mudança, objetivos, auditoria e análise crítica.",
    topicos: [
      "Contexto & Partes: registre questões internas/externas, partes interessadas e o escopo do SGSST (cláusulas 4.1–4.4).",
      "Política de SST: publique a política versionada e colete a ciência dos trabalhadores (5.2).",
      "Gestão de Mudança (MOC): avalie riscos antes de mudar e planeje a dimensão humana via ADKAR (8.1.3).",
      "Objetivos e Requisitos legais: defina metas mensuráveis (6.2) e avalie o atendimento legal (6.1.3).",
      "Plano de Emergência, Auditorias internas, Comunicação/Consulta e Análise crítica pela direção (8.2 / 9.2 / 7.4 / 9.3).",
    ],
    manuais: ["contexto-sgsst", "politica-sst", "gestao-mudanca", "objetivos-sst", "requisitos-legais", "plano-emergencia", "auditorias-internas", "comunicacao-consulta", "analise-critica"],
    rotas: [{ label: "Contexto & Partes", href: "/contexto" }, { label: "Política de SST", href: "/politica" }, { label: "Análise Crítica", href: "/analise-critica" }],
  },

  // ───────────────────────── People — RH ─────────────────────────
  {
    slug: "people-visao-geral", ordem: 15, secao: "People — RH", externo: true,
    titulo: "People (RH) — visão geral",
    objetivo: "Saber o que é tratado no People e como ele se conecta ao SST.",
    topicos: [
      "O People é o sistema de RH: colaboradores, cargos, centros de responsabilidade e documentos de pessoal.",
      "Multiempresa e empresa ativa funcionam como no SST.",
      "Os dados de pessoal cadastrados no People alimentam o SST.",
      "Acesse o People no seu endereço próprio (app separado).",
    ],
  },
  {
    slug: "people-psicossocial", ordem: 16, secao: "People — RH", externo: true,
    titulo: "Psicossocial no People (RH)",
    objetivo: "Consultar resultados psicossociais e conduzir o plano de ação no RH.",
    topicos: [
      "O People lê os resultados psicossociais do SST (somente leitura, respeitando o anonimato).",
      "O RH/diretoria acompanha e registra o plano de ação no People.",
      "Fechando esta trilha, você entendeu o ciclo completo: identificar no SST, agir no RH.",
    ],
  },
]

export const SECOES_TRILHA: SecaoTrilha[] = ["Ecossistema", "SST — Segurança", "People — RH"]

export function getModulo(slug: string): ModuloTrilha | undefined {
  return TRILHA.find((m) => m.slug === slug)
}

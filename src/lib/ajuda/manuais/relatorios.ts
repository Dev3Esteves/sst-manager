import type { Manual } from "../tipos"

export const manuaisRelatorios: Manual[] = [
  {
    slug: "dashboard",
    titulo: "Dashboard",
    modulo: "Dashboard",
    categoria: "Relatórios",
    rota: "/dashboard",
    perfis: ["Administrador", "Gestor / Diretoria", "Técnico de Segurança"],
    resumo: "Visão geral com indicadores (KPIs) e o panorama de riscos por NR. Ponto de partida para acompanhar a saúde do SST da organização.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Apresenta os principais números do SST (vencimentos, ocorrências, conformidade) e a distribuição por NR, para leitura rápida da situação." },
        { tipo: "dica", texto: "Use o dashboard no início do dia/semana para priorizar o que precisa de ação (itens críticos e vencidos)." },
      ] },
    ],
  },
  {
    slug: "vencimentos",
    titulo: "Vencimentos",
    modulo: "Vencimentos",
    categoria: "Relatórios",
    rota: "/vencimentos",
    perfis: ["Administrador", "Técnico de Segurança", "RH"],
    resumo: "Lista unificada de exames, treinamentos e CAs de EPI a vencer, com classificação semáforo (em dia / alerta / crítico / vencido).",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Reúne tudo que tem prazo (ASO, treinamentos, CA de EPI) num só lugar, ordenado por urgência, para você renovar antes de vencer." },
        { tipo: "campos", itens: [
          { campo: "Vencido", descricao: "Já passou da data — ação imediata." },
          { campo: "Crítico (≤30 dias)", descricao: "Renovar com urgência." },
          { campo: "Alerta (≤60 dias)", descricao: "Programar a renovação." },
          { campo: "Em dia", descricao: "Sem ação imediata." },
        ] },
      ] },
      { titulo: "Dica", blocos: [
        { tipo: "dica", texto: "As notificações por e-mail (quando configuradas) avisam os gestores nos marcos de 30/15/7 dias — o painel mostra o quadro completo a qualquer momento." },
      ] },
    ],
  },
  {
    slug: "matriz-treinamentos",
    titulo: "Matriz de Treinamentos",
    modulo: "Matriz",
    categoria: "Relatórios",
    rota: "/matriz-treinamentos",
    perfis: ["Administrador", "Técnico de Segurança", "RH"],
    resumo: "Cruzamento colaborador × treinamento (NR), mostrando quem está treinado, vencido ou pendente — visão de cobertura.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Mostra, numa matriz, a situação de cada colaborador em cada treinamento exigido — útil para planejar turmas e cobrir lacunas." },
        { tipo: "cenario", situacao: "um colaborador aparece pendente numa NR exigida pela função", orientacao: "agende o treinamento; ele bloqueia a emissão de autorizações que dependem dessa NR." },
      ] },
    ],
  },
  {
    slug: "nao-conformidades",
    titulo: "Não-Conformidades",
    modulo: "NCs",
    categoria: "Relatórios",
    rota: "/nao-conformidades",
    perfis: ["Técnico de Segurança", "Engenheiro de Segurança", "Gestor / Diretoria"],
    resumo: "Gestão estruturada de não-conformidades (ISO 45001 cl. 10.2) com causa raiz (5 Porquês / Ishikawa) e ações corretivas.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Centraliza as NCs de múltiplas origens (ocorrência, auditoria, inspeção, reclamação, desvio), com análise de causa e plano de ações corretivas — fechando o ciclo de melhoria." },
      ] },
      { titulo: "Padrões de escrita", blocos: [
        { tipo: "padrao", recomendado: "NC: 'Andaime sem travamento das rodas na frente 3.' Causa raiz: 'Montagem sem checklist de liberação.' AC: 'Implantar checklist de liberação de andaime, responsável Encarregado, prazo 15 dias.'", evitar: "NC: 'Andaime errado.' AC: 'Corrigir.'" },
        { tipo: "atencao", texto: "Toda ação corretiva precisa de tipo (contenção/corretiva/preventiva), responsável e prazo — sem isso, a NC não fecha o ciclo." },
      ] },
    ],
  },
  {
    slug: "relatorio-mensal",
    titulo: "Relatório Mensal",
    modulo: "Relatório mensal",
    categoria: "Relatórios",
    rota: "/relatorios/mensal",
    perfis: ["Técnico de Segurança", "Gestor / Diretoria"],
    resumo: "Consolidado mensal com indicadores de SST (incluindo TF/TG conforme NBR 14280) para apresentação à gestão e ao cliente.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Gera o panorama do mês (ocorrências, treinamentos, inspeções, indicadores) para reuniões de SST e prestação de contas." },
        { tipo: "dica", texto: "Os indicadores TF (Taxa de Frequência) e TG (Taxa de Gravidade) dependem do HHT (Horas-Homem Trabalhadas) — mantenha esse dado atualizado para os cálculos saírem corretos." },
      ] },
    ],
  },
  {
    slug: "heatmap-ocorrencias",
    titulo: "Heatmap de Ocorrências",
    modulo: "Heatmap",
    categoria: "Relatórios",
    rota: "/relatorios/heatmap-ocorrencias",
    perfis: ["Técnico de Segurança", "Engenheiro de Segurança", "Gestor / Diretoria"],
    resumo: "Mapa de calor das ocorrências (por local/região do corpo/período) para identificar padrões e concentrar a prevenção.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Visualiza onde os eventos se concentram, ajudando a direcionar ações preventivas para os pontos mais críticos." },
        { tipo: "cenario", situacao: "uma área/região do corpo concentra ocorrências", orientacao: "investigue a causa comum (procedimento, EPI, layout) e crie ação corretiva no módulo de NCs." },
      ] },
    ],
  },
]

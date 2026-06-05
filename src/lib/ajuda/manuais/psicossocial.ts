import type { Manual } from "../tipos"

export const manualPsicossocial: Manual = {
  slug: "psicossocial",
  titulo: "Riscos Psicossociais (NR-01)",
  modulo: "Psicossocial",
  rota: "/psicossocial",
  perfis: ["Administrador", "Técnico de Segurança", "RH"],
  resumo:
    "Avaliação dos Fatores de Risco Psicossociais Relacionados ao Trabalho (FRPRT) exigida pela NR-01, por questionário anônimo (COPSOQ II-Br), com resultado por GHE integrado ao Inventário do PGR.",
  secoes: [
    {
      titulo: "Para que serve",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "Desde 26/05/2026, a NR-01 (Portaria MTE 1.419/2024) torna obrigatório identificar, avaliar e tratar os riscos psicossociais no Gerenciamento de Riscos Ocupacionais (GRO/PGR). Este módulo aplica um questionário validado, calcula o risco por Grupo Homogêneo de Exposição (GHE) e gera evidência defensável para a fiscalização.",
        },
        {
          tipo: "atencao",
          texto:
            "A avaliação mede CONDIÇÕES de trabalho (estressores), não sintomas individuais. As respostas são anônimas e os resultados só aparecem agregados por GHE (mínimo de respondentes), em conformidade com a LGPD.",
        },
      ],
    },
    {
      titulo: "Pré-requisito: cadastrar os GHEs no PGR",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "A campanha psicossocial avalia os GHEs de um PGR. Antes de criar a campanha, o PGR da obra precisa ter os GHEs cadastrados.",
        },
        {
          tipo: "passos",
          itens: [
            "Acesse o módulo PGR e abra (ou crie) o PGR da obra.",
            "Na seção de GHE, clique em 'Novo GHE'.",
            "Preencha Código (ex.: GHE 01), Descrição (ex.: ADMINISTRAÇÃO) e o Nº de empregados expostos.",
            "Repita para cada grupo de trabalhadores com exposição semelhante.",
          ],
        },
        {
          tipo: "dica",
          texto:
            "GHE = Grupo Homogêneo de Exposição: agrupa funções com condições de trabalho parecidas (ex.: 'Pedreiros — Obra A', 'Administrativo — Matriz'). É a unidade de análise do psicossocial.",
        },
      ],
    },
    {
      titulo: "Passo a passo da campanha",
      blocos: [
        {
          tipo: "passos",
          itens: [
            "Em Psicossocial (NR-01), clique em 'Nova campanha'.",
            "Escolha o PGR (obra), dê um título, selecione a versão (curta para frentes de obra) e a data de início.",
            "Na tela da campanha, clique em 'Gerar/atualizar links por GHE' — é criado um link/QR anônimo por GHE.",
            "Clique em 'Abrir para respostas' (a campanha passa de Rascunho para Aberta).",
            "Distribua o link ou QR de cada GHE aos trabalhadores (cartaz, WhatsApp, tablet no canteiro).",
            "Acompanhe a adesão na própria tela (respostas por GHE), sem identificar quem respondeu.",
            "Quando houver respostas suficientes, clique em 'Encerrar' e depois em 'Calcular resultados'.",
            "Veja o mapa de calor (GHE × dimensão) e clique em 'Lançar no Inventário do PGR' para registrar os riscos médio/alto.",
            "Baixe o 'Relatório PDF' para auditoria/arquivo.",
          ],
        },
        {
          tipo: "atencao",
          texto:
            "Cada GHE precisa de no mínimo 5 respostas para o resultado aparecer (proteção de anonimato). Abaixo disso, o resultado fica 'suprimido'. Responda/colete o suficiente antes de calcular.",
        },
        {
          tipo: "dica",
          texto:
            "O link só recebe respostas com a campanha 'Aberta'. Em Rascunho, Encerrada ou Analisada, ele mostra 'pesquisa indisponível' — isso é esperado.",
        },
      ],
    },
    {
      titulo: "Como interpretar o resultado",
      blocos: [
        {
          tipo: "campos",
          itens: [
            { campo: "Verde (0–33)", descricao: "Risco baixo — condição favorável." },
            { campo: "Amarelo (34–66)", descricao: "Risco médio — requer atenção e acompanhamento." },
            { campo: "Vermelho (67–100)", descricao: "Risco alto — prioridade de ação no PGR." },
          ],
        },
        {
          tipo: "paragrafo",
          texto:
            "As dimensões em amarelo/vermelho viram itens no Inventário de Riscos do PGR (categoria psicossocial), de onde se faz o plano de ação (PDCA) e a reavaliação.",
        },
      ],
    },
  ],
}

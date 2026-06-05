import type { Manual } from "../tipos"

export const manualApr: Manual = {
  slug: "apr",
  titulo: "APR — Análise Preliminar de Risco",
  modulo: "Documentos SST",
  rota: "/documentos/apr/new",
  perfis: ["Técnico de Segurança", "Engenheiro de Segurança"],
  resumo:
    "Documento que antecede a tarefa: identifica perigos, avalia o risco (matriz 5×5), define medidas de controle e EPIs. Este manual inclui padrões de escrita para preencher cada campo com qualidade.",
  secoes: [
    {
      titulo: "Para que serve",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "A APR estrutura, antes de iniciar uma atividade, quais perigos existem, qual a severidade/probabilidade de cada um e quais medidas reduzem o risco. É um documento de prevenção e também de evidência.",
        },
      ],
    },
    {
      titulo: "Passo a passo",
      blocos: [
        {
          tipo: "passos",
          itens: [
            "Em Documentos SST → Novo documento → APR.",
            "Preencha a identificação (local, data, responsável, equipe).",
            "Para cada linha de risco: descreva a atividade, o perigo, a severidade e a probabilidade.",
            "Defina a medida de controle e o responsável por ela.",
            "Liste os EPIs obrigatórios.",
            "Revise e emita — o PDF é gerado e fica registrado.",
          ],
        },
      ],
    },
    {
      titulo: "Campos principais",
      blocos: [
        {
          tipo: "campos",
          itens: [
            { campo: "Atividade", descricao: "A tarefa concreta que será executada.", obrigatorio: true },
            { campo: "Perigo", descricao: "A fonte do dano (não o dano em si).", obrigatorio: true },
            { campo: "Severidade × Probabilidade", descricao: "Classificação do risco na matriz 5×5.", obrigatorio: true },
            { campo: "Medida de controle", descricao: "Ação concreta que elimina ou reduz o risco.", obrigatorio: true },
            { campo: "Responsável", descricao: "Quem garante a medida (função, não 'todos')." },
          ],
        },
      ],
    },
    {
      titulo: "Padrões de escrita — Perigo",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "Descreva o PERIGO (a fonte), não a consequência. Seja específico sobre a fonte de energia/agente.",
        },
        {
          tipo: "padrao",
          recomendado: "Trabalho em altura acima de 2 m em borda de laje sem guarda-corpo",
          evitar: "Cair / acidente / perigo de queda",
        },
        {
          tipo: "padrao",
          recomendado: "Contato com partes energizadas em painel de 380 V durante manutenção",
          evitar: "Choque elétrico",
        },
      ],
    },
    {
      titulo: "Padrões de escrita — Medida de controle",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "A medida deve ser uma AÇÃO verificável, seguindo a hierarquia de controles (eliminar > engenharia > administrativa > EPI). Evite frases genéricas.",
        },
        {
          tipo: "padrao",
          recomendado: "Instalar guarda-corpo provisório (1,20 m) em todo o perímetro da laje antes do início do serviço",
          evitar: "Ter cuidado / usar EPI / atenção redobrada",
        },
        {
          tipo: "dica",
          texto:
            "Toda medida deve ter um responsável por FUNÇÃO (ex.: 'Encarregado de obra'), com verbo no infinitivo e condição clara de conclusão.",
        },
      ],
    },
  ],
}

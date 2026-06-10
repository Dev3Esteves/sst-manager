/**
 * Instrumento HSE-IT — Management Standards Indicator Tool (Health & Safety
 * Executive, Reino Unido), adaptado/validado para o português.
 *
 * Estrutura: 35 itens, 7 dimensões (Demandas 8, Controle 6, Apoio da Gestão 5,
 * Apoio dos Colegas 4, Relacionamentos 4, Função/Papel 5, Mudança 3). Escala
 * Likert de 5 pontos. No HSE, pontuação alta = ambiente BEM gerido (bom); aqui
 * trabalhamos em espaço de RISCO (alto = pior), então:
 *   - itens POSITIVOS (controle, apoio, clareza de papel, mudança) → reverso=true
 *     (responder "Sempre/Concordo" = bom = risco baixo);
 *   - itens NEGATIVOS (demandas, assédio/atrito) → reverso=false
 *     (responder "Sempre" = ruim = risco alto).
 *
 * Referências: HSE Management Standards Indicator Tool — User Manual
 * (hse.gov.uk); validação PT no "livreto" e artigo IFCE (acervo de Referências).
 *
 * ⚠️ TEXTO ADAPTADO (oficial=false): enunciados em português baseados no manual
 * HSE e na versão do livreto; revisar com a tradução validada antes de produção.
 */
import type { InstrumentoDef } from "./scoring"

/** Escala de frequência de 5 pontos (livreto HSE). Convertida para risco 0-100. */
export const ESCALA_HSE = {
  rotulos: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"],
  valores: [0, 25, 50, 75, 100],
} as const

export const HSE_META = {
  instrumento: "HSE-IT (Indicator Tool)",
  versao_schema: "2024.1",
  oficial: false,
  fonte: "HSE Management Standards Indicator Tool (UK) — adaptação PT (livreto/IFCE)",
  instrucao:
    "Pense nas suas condições de trabalho nos últimos 6 meses e marque a frequência com que cada situação ocorre.",
} as const

// HSE tem versão única (não há curta/média). Marcamos os itens com "unica".
const U = ["unica"]

export const HSE_IT_BR: InstrumentoDef = {
  // Tercis no espaço de risco (0-100). Pode ser calibrado por benchmark depois.
  faixas: { verdeMax: 33.3, amareloMax: 66.6 },
  dominios: [
    {
      id: "demandas",
      nome: "Demandas",
      dimensoes: [
        {
          id: "demandas",
          nome: "Demandas",
          risco_direcao: "direto",
          versoes: U,
          itens: [
            { id: "H3", texto: "Grupos diferentes no trabalho me exigem coisas difíceis de conciliar.", reverso: false, versoes: U },
            { id: "H6", texto: "Tenho prazos impossíveis de cumprir.", reverso: false, versoes: U },
            { id: "H9", texto: "Tenho que trabalhar muito intensamente.", reverso: false, versoes: U },
            { id: "H12", texto: "Preciso negligenciar algumas tarefas porque tenho trabalho demais.", reverso: false, versoes: U },
            { id: "H16", texto: "Não consigo fazer pausas suficientes.", reverso: false, versoes: U },
            { id: "H18", texto: "Sou pressionado(a) a trabalhar por longas horas.", reverso: false, versoes: U },
            { id: "H20", texto: "Tenho que trabalhar muito rápido.", reverso: false, versoes: U },
            { id: "H22", texto: "Tenho prazos de tempo irreais (curtos demais).", reverso: false, versoes: U },
          ],
        },
      ],
    },
    {
      id: "controle",
      nome: "Controle",
      dimensoes: [
        {
          id: "controle",
          nome: "Controle",
          risco_direcao: "inverso",
          versoes: U,
          itens: [
            { id: "H2", texto: "Posso decidir quando fazer uma pausa.", reverso: true, versoes: U },
            { id: "H10", texto: "Tenho influência sobre o ritmo do meu trabalho.", reverso: true, versoes: U },
            { id: "H15", texto: "Tenho liberdade para decidir como fazer o meu trabalho.", reverso: true, versoes: U },
            { id: "H19", texto: "Tenho escolha sobre o que faço no trabalho.", reverso: true, versoes: U },
            { id: "H25", texto: "Tenho alguma influência sobre a forma como trabalho.", reverso: true, versoes: U },
            { id: "H30", texto: "Meu horário de trabalho pode ser flexível.", reverso: true, versoes: U },
          ],
        },
      ],
    },
    {
      id: "apoio_gestao",
      nome: "Apoio da Gestão",
      dimensoes: [
        {
          id: "apoio_gestao",
          nome: "Apoio da Gestão",
          risco_direcao: "inverso",
          versoes: U,
          itens: [
            { id: "H8", texto: "Recebo retorno (feedback) de apoio sobre o trabalho que faço.", reverso: true, versoes: U },
            { id: "H23", texto: "Posso contar com meu superior imediato para me ajudar num problema de trabalho.", reverso: true, versoes: U },
            { id: "H29", texto: "Posso conversar com meu superior imediato sobre algo que me incomodou no trabalho.", reverso: true, versoes: U },
            { id: "H33", texto: "Tenho apoio em trabalhos emocionalmente exigentes.", reverso: true, versoes: U },
            { id: "H35", texto: "Meu superior imediato me incentiva no trabalho.", reverso: true, versoes: U },
          ],
        },
      ],
    },
    {
      id: "apoio_colegas",
      nome: "Apoio dos Colegas",
      dimensoes: [
        {
          id: "apoio_colegas",
          nome: "Apoio dos Colegas",
          risco_direcao: "inverso",
          versoes: U,
          itens: [
            { id: "H7", texto: "Se o trabalho fica difícil, meus colegas me ajudam.", reverso: true, versoes: U },
            { id: "H24", texto: "Recebo a ajuda e o apoio de que preciso dos meus colegas.", reverso: true, versoes: U },
            { id: "H27", texto: "Recebo dos colegas o respeito que mereço no trabalho.", reverso: true, versoes: U },
            { id: "H31", texto: "Meus colegas se dispõem a ouvir meus problemas de trabalho.", reverso: true, versoes: U },
          ],
        },
      ],
    },
    {
      id: "relacionamentos",
      nome: "Relacionamentos",
      dimensoes: [
        {
          id: "relacionamentos",
          nome: "Relacionamentos",
          risco_direcao: "direto",
          versoes: U,
          itens: [
            { id: "H5", texto: "Sou alvo de assédio pessoal, na forma de palavras ou comportamentos rudes.", reverso: false, versoes: U },
            { id: "H14", texto: "Há atrito ou raiva entre colegas.", reverso: false, versoes: U },
            { id: "H21", texto: "Sofro intimidação (bullying) no trabalho.", reverso: false, versoes: U },
            { id: "H34", texto: "Os relacionamentos no trabalho são tensos.", reverso: false, versoes: U },
          ],
        },
      ],
    },
    {
      id: "papel",
      nome: "Função/Papel",
      dimensoes: [
        {
          id: "papel",
          nome: "Função/Papel",
          risco_direcao: "inverso",
          versoes: U,
          itens: [
            { id: "H1", texto: "Tenho clareza sobre o que se espera de mim no trabalho.", reverso: true, versoes: U },
            { id: "H4", texto: "Sei como realizar o meu trabalho.", reverso: true, versoes: U },
            { id: "H11", texto: "Tenho clareza sobre meus deveres e responsabilidades.", reverso: true, versoes: U },
            { id: "H13", texto: "Tenho clareza sobre as metas e objetivos do meu setor.", reverso: true, versoes: U },
            { id: "H17", texto: "Entendo como meu trabalho se encaixa no objetivo geral da organização.", reverso: true, versoes: U },
          ],
        },
      ],
    },
    {
      id: "mudanca",
      nome: "Mudança",
      dimensoes: [
        {
          id: "mudanca",
          nome: "Mudança",
          risco_direcao: "inverso",
          versoes: U,
          itens: [
            { id: "H26", texto: "Tenho oportunidades suficientes de questionar os gestores sobre mudanças no trabalho.", reverso: true, versoes: U },
            { id: "H28", texto: "Os funcionários são sempre consultados sobre mudanças no trabalho.", reverso: true, versoes: U },
            { id: "H32", texto: "Quando ocorrem mudanças no trabalho, tenho clareza de como elas funcionarão na prática.", reverso: true, versoes: U },
          ],
        },
      ],
    },
  ],
}

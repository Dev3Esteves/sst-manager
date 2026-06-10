/**
 * Instrumento CBI — Copenhagen Burnout Inventory (Kristensen et al., 2005).
 *
 * Instrumento de DESFECHO (mede burnout, uma consequência — não fator de risco):
 * todas as dimensões têm tipo="desfecho" e NÃO alimentam o Inventário do PGR,
 * apenas o monitoramento. Livre / open-access (uso comercial permitido).
 *
 * Estrutura: 19 itens, 3 dimensões — Esgotamento Pessoal (6), Esgotamento
 * Relacionado ao Trabalho (7), Esgotamento Relacionado ao Cliente (6). Escala de
 * frequência 5 pontos convertida para 0-100 (média por dimensão). Pontuação alta
 * = mais burnout (reverso=false), exceto o item de energia para a vida pessoal
 * (reverso=true). Interpretação usual: <50 baixo, 50-74 moderado, ≥75 alto.
 *
 * Obs.: a dimensão "Cliente" pode não se aplicar a funções sem atendimento; nesse
 * caso, pode ser desconsiderada na leitura. ⚠️ Texto em PT adaptado (oficial=false).
 */
import type { InstrumentoDef } from "./scoring"

export const ESCALA_CBI = {
  rotulos: ["Nunca/quase nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"],
  valores: [0, 25, 50, 75, 100],
} as const

export const CBI_META = {
  instrumento: "CBI (Copenhagen Burnout Inventory)",
  versao_schema: "2005.1",
  oficial: false,
  fonte: "Kristensen et al. (2005) — Copenhagen Burnout Inventory (open-access)",
  instrucao: "Pense nas últimas semanas e marque a frequência com que você se sente assim.",
} as const

const U = ["unica"]

export const CBI_BR: InstrumentoDef = {
  metodo: "media",
  // Burnout: <50 baixo, 50-74 moderado, ≥75 alto.
  faixas: { verdeMax: 49.99, amareloMax: 74.99 },
  dominios: [
    {
      id: "burnout",
      nome: "Burnout",
      dimensoes: [
        {
          id: "esgotamento_pessoal",
          nome: "Esgotamento Pessoal",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "C1", texto: "Com que frequência você se sente cansado(a)?", reverso: false, versoes: U },
            { id: "C2", texto: "Com que frequência você se sente fisicamente esgotado(a)?", reverso: false, versoes: U },
            { id: "C3", texto: "Com que frequência você se sente emocionalmente esgotado(a)?", reverso: false, versoes: U },
            { id: "C4", texto: "Com que frequência você pensa: \"Não aguento mais\"?", reverso: false, versoes: U },
            { id: "C5", texto: "Com que frequência você se sente exausto(a)?", reverso: false, versoes: U },
            { id: "C6", texto: "Com que frequência você se sente fraco(a) e suscetível a doenças?", reverso: false, versoes: U },
          ],
        },
        {
          id: "esgotamento_trabalho",
          nome: "Esgotamento Relacionado ao Trabalho",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "C7", texto: "Seu trabalho é emocionalmente desgastante?", reverso: false, versoes: U },
            { id: "C8", texto: "Você se sente esgotado(a) por causa do seu trabalho?", reverso: false, versoes: U },
            { id: "C9", texto: "Seu trabalho o(a) frustra?", reverso: false, versoes: U },
            { id: "C10", texto: "Você se sente esgotado(a) ao fim de um dia de trabalho?", reverso: false, versoes: U },
            { id: "C11", texto: "Você se sente exausto(a) de manhã ao pensar em mais um dia de trabalho?", reverso: false, versoes: U },
            { id: "C12", texto: "Você sente que cada hora de trabalho é cansativa para você?", reverso: false, versoes: U },
            { id: "C13", texto: "Você tem energia suficiente para a família e os amigos no tempo livre?", reverso: true, versoes: U },
          ],
        },
        {
          id: "esgotamento_cliente",
          nome: "Esgotamento Relacionado ao Cliente",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "C14", texto: "Você acha difícil trabalhar com clientes/usuários?", reverso: false, versoes: U },
            { id: "C15", texto: "Trabalhar com clientes/usuários drena a sua energia?", reverso: false, versoes: U },
            { id: "C16", texto: "Você acha frustrante trabalhar com clientes/usuários?", reverso: false, versoes: U },
            { id: "C17", texto: "Você sente que dá mais do que recebe ao trabalhar com clientes/usuários?", reverso: false, versoes: U },
            { id: "C18", texto: "Você está cansado(a) de trabalhar com clientes/usuários?", reverso: false, versoes: U },
            { id: "C19", texto: "Você às vezes se pergunta por quanto tempo conseguirá continuar trabalhando com clientes/usuários?", reverso: false, versoes: U },
          ],
        },
      ],
    },
  ],
}

/**
 * Instrumento DASS-21 — Depression Anxiety Stress Scales, versão de 21 itens
 * (Lovibond & Lovibond; adaptação brasileira de Vignola & Tucci, 2014).
 *
 * Instrumento de DESFECHO (sintomas de depressão, ansiedade e estresse — não são
 * fatores de risco): tipo="desfecho", NÃO alimenta o Inventário do PGR, apenas
 * monitoramento. Domínio público para uso clínico/pesquisa; uso comercial pode
 * exigir permissão da Psychology Foundation of Australia.
 *
 * Estrutura: 21 itens, 3 subescalas de 7 itens (Depressão, Ansiedade, Estresse).
 * Escala 0-3 (0 = não se aplicou; 3 = aplicou-se muito). Pontuação por subescala
 * = soma dos 7 itens × 2 (0-42), classificada em 5 níveis (normal/leve/moderado/
 * severo/extremamente severo) com cortes PRÓPRIOS por subescala — por isso o
 * instrumento usa metodo="dass21" (scoring nativo no motor).
 */
import type { InstrumentoDef } from "./scoring"

export const ESCALA_DASS = {
  rotulos: [
    "Não se aplicou",
    "Aplicou-se em algum grau / às vezes",
    "Aplicou-se em grau considerável / boa parte do tempo",
    "Aplicou-se muito / na maioria do tempo",
  ],
  valores: [0, 1, 2, 3],
} as const

export const DASS_META = {
  instrumento: "DASS-21 (Depressão, Ansiedade e Estresse)",
  versao_schema: "2014.1",
  oficial: false,
  fonte: "Lovibond & Lovibond; adaptação BR Vignola & Tucci (2014)",
  instrucao:
    "Leia cada afirmação e indique o quanto ela se aplicou a você durante a ÚLTIMA SEMANA.",
} as const

const U = ["unica"]

export const DASS21_BR: InstrumentoDef = {
  metodo: "dass21",
  dominios: [
    {
      id: "dass",
      nome: "DASS-21",
      dimensoes: [
        {
          id: "depressao",
          nome: "Depressão",
          risco_direcao: "direto",
          tipo: "desfecho",
          dassSubescala: "depressao",
          versoes: U,
          itens: [
            { id: "D3", texto: "Não consegui vivenciar nenhum sentimento positivo.", reverso: false, versoes: U },
            { id: "D5", texto: "Achei difícil ter iniciativa para fazer as coisas.", reverso: false, versoes: U },
            { id: "D10", texto: "Senti que não tinha nada a desejar/esperar do futuro.", reverso: false, versoes: U },
            { id: "D13", texto: "Senti-me desanimado(a) e melancólico(a).", reverso: false, versoes: U },
            { id: "D16", texto: "Não consegui me entusiasmar com nada.", reverso: false, versoes: U },
            { id: "D17", texto: "Senti que não tinha valor como pessoa.", reverso: false, versoes: U },
            { id: "D21", texto: "Senti que a vida não tinha sentido.", reverso: false, versoes: U },
          ],
        },
        {
          id: "ansiedade",
          nome: "Ansiedade",
          risco_direcao: "direto",
          tipo: "desfecho",
          dassSubescala: "ansiedade",
          versoes: U,
          itens: [
            { id: "D2", texto: "Senti minha boca seca.", reverso: false, versoes: U },
            { id: "D4", texto: "Tive dificuldade em respirar em alguns momentos (sem ter feito esforço físico).", reverso: false, versoes: U },
            { id: "D7", texto: "Senti tremores (por exemplo, nas mãos).", reverso: false, versoes: U },
            { id: "D9", texto: "Preocupei-me com situações em que eu pudesse entrar em pânico e parecer ridículo(a).", reverso: false, versoes: U },
            { id: "D15", texto: "Senti que ia entrar em pânico.", reverso: false, versoes: U },
            { id: "D19", texto: "Percebi alterações do meu coração sem fazer esforço físico (ex.: aumento da frequência cardíaca).", reverso: false, versoes: U },
            { id: "D20", texto: "Senti medo sem motivo.", reverso: false, versoes: U },
          ],
        },
        {
          id: "estresse",
          nome: "Estresse",
          risco_direcao: "direto",
          tipo: "desfecho",
          dassSubescala: "estresse",
          versoes: U,
          itens: [
            { id: "D1", texto: "Achei difícil me acalmar.", reverso: false, versoes: U },
            { id: "D6", texto: "Tive a tendência de reagir de forma exagerada às situações.", reverso: false, versoes: U },
            { id: "D8", texto: "Senti que estava usando muita energia nervosa.", reverso: false, versoes: U },
            { id: "D11", texto: "Senti-me agitado(a).", reverso: false, versoes: U },
            { id: "D12", texto: "Achei difícil relaxar.", reverso: false, versoes: U },
            { id: "D14", texto: "Fui intolerante com as coisas que me impediam de continuar o que eu estava fazendo.", reverso: false, versoes: U },
            { id: "D18", texto: "Senti que estava um pouco emotivo(a)/sensível demais.", reverso: false, versoes: U },
          ],
        },
      ],
    },
  ],
}

/**
 * Instrumento COPSOQ III (adaptação Brasil) — definição estruturada.
 *
 * ⚠️ RASCUNHO: os textos de itens abaixo são REPRESENTATIVOS, para operar o
 * motor e a coleta. Antes de produção, substituir pelo texto OFICIAL da versão
 * validada no Brasil (COPSOQ III-Br) — sujeito a licença do COPSOQ International
 * Network. A estrutura (domínios, dimensões, escala, direção de risco) segue o
 * padrão COPSOQ e não muda com a troca do texto.
 *
 * Escala Likert 0-100; `reverso=true` em dimensões positivas (apoio, autonomia).
 */
import type { InstrumentoDef } from "./scoring"

export const ESCALA_LIKERT = {
  rotulos: ["Nunca/quase nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"],
  valores: [0, 25, 50, 75, 100],
} as const

export const CLASSIFICACAO_TERCIS = {
  metodo: "tercis",
  faixas: {
    verde: { min: 0, max: 33.3, rotulo: "Risco baixo" },
    amarelo: { min: 33.4, max: 66.6, rotulo: "Risco médio" },
    vermelho: { min: 66.7, max: 100, rotulo: "Risco alto" },
  },
  min_respondentes_ghe: 5,
} as const

export const COPSOQ_META = {
  instrumento: "COPSOQ III-Br",
  versao_schema: "1.0",
  oficial: false,
} as const

export const COPSOQ_BR: InstrumentoDef = {
  dominios: [
    {
      id: "demandas",
      nome: "Exigências no trabalho",
      dimensoes: [
        {
          id: "demandas_quantitativas",
          nome: "Demandas quantitativas (sobrecarga)",
          risco_direcao: "direto",
          versoes: ["curto", "medio"],
          itens: [
            { id: "DQ1", texto: "Você precisa fazer mais do que consegue dar conta no seu trabalho?", reverso: false },
            { id: "DQ2", texto: "Você fica atrasado(a) com suas tarefas por excesso de trabalho?", reverso: false, versoes: ["medio"] },
          ],
        },
        {
          id: "ritmo_trabalho",
          nome: "Ritmo de trabalho",
          risco_direcao: "direto",
          versoes: ["curto", "medio"],
          itens: [{ id: "RT1", texto: "Você precisa trabalhar muito rápido?", reverso: false }],
        },
        {
          id: "demandas_cognitivas",
          nome: "Demandas cognitivas",
          risco_direcao: "direto",
          versoes: ["medio"],
          itens: [{ id: "DC1", texto: "Seu trabalho exige muita concentração e atenção?", reverso: false }],
        },
        {
          id: "demandas_emocionais",
          nome: "Demandas emocionais",
          risco_direcao: "direto",
          versoes: ["curto", "medio"],
          itens: [{ id: "DE1", texto: "Seu trabalho exige que você lide com situações emocionalmente difíceis?", reverso: false }],
        },
      ],
    },
    {
      id: "organizacao_conteudo",
      nome: "Organização e conteúdo do trabalho",
      dimensoes: [
        {
          id: "influencia",
          nome: "Influência / autonomia no trabalho",
          risco_direcao: "inverso",
          versoes: ["curto", "medio"],
          itens: [{ id: "IN1", texto: "Você tem influência sobre as decisões relativas ao seu trabalho?", reverso: true }],
        },
        {
          id: "desenvolvimento",
          nome: "Possibilidades de desenvolvimento",
          risco_direcao: "inverso",
          versoes: ["medio"],
          itens: [{ id: "PD1", texto: "Seu trabalho permite que você aprenda coisas novas?", reverso: true }],
        },
        {
          id: "significado",
          nome: "Significado do trabalho",
          risco_direcao: "inverso",
          versoes: ["curto", "medio"],
          itens: [{ id: "SG1", texto: "Seu trabalho tem sentido/significado para você?", reverso: true }],
        },
      ],
    },
    {
      id: "relacoes_lideranca",
      nome: "Relações interpessoais e liderança",
      dimensoes: [
        {
          id: "previsibilidade",
          nome: "Previsibilidade",
          risco_direcao: "inverso",
          versoes: ["medio"],
          itens: [{ id: "PR1", texto: "Você recebe com antecedência as informações necessárias para o seu trabalho?", reverso: true }],
        },
        {
          id: "reconhecimento",
          nome: "Reconhecimento e recompensas",
          risco_direcao: "inverso",
          versoes: ["curto", "medio"],
          itens: [{ id: "RC1", texto: "Seu trabalho é reconhecido e valorizado pela gestão?", reverso: true }],
        },
        {
          id: "clareza_papel",
          nome: "Clareza de papel",
          risco_direcao: "inverso",
          versoes: ["curto", "medio"],
          itens: [{ id: "CP1", texto: "Você sabe exatamente quais são as suas responsabilidades?", reverso: true }],
        },
        {
          id: "conflito_papel",
          nome: "Conflitos de papel",
          risco_direcao: "direto",
          versoes: ["medio"],
          itens: [{ id: "CF1", texto: "Você recebe ordens ou exigências contraditórias de pessoas diferentes?", reverso: false }],
        },
        {
          id: "qualidade_lideranca",
          nome: "Qualidade da liderança",
          risco_direcao: "inverso",
          versoes: ["curto", "medio"],
          itens: [{ id: "QL1", texto: "Sua chefia imediata planeja bem o trabalho e resolve conflitos de forma justa?", reverso: true }],
        },
        {
          id: "apoio_supervisor",
          nome: "Apoio social da chefia",
          risco_direcao: "inverso",
          versoes: ["medio"],
          itens: [{ id: "AS1", texto: "Você recebe ajuda e apoio da sua chefia quando precisa?", reverso: true }],
        },
        {
          id: "apoio_colegas",
          nome: "Apoio social dos colegas",
          risco_direcao: "inverso",
          versoes: ["curto", "medio"],
          itens: [{ id: "AC1", texto: "Você recebe ajuda e apoio dos seus colegas quando precisa?", reverso: true }],
        },
      ],
    },
    {
      id: "interface_individuo",
      nome: "Interface trabalho-indivíduo",
      dimensoes: [
        {
          id: "inseguranca_emprego",
          nome: "Insegurança no emprego",
          risco_direcao: "direto",
          versoes: ["curto", "medio"],
          itens: [{ id: "IE1", texto: "Você se preocupa em ficar desempregado(a)?", reverso: false }],
        },
        {
          id: "conflito_trabalho_vida",
          nome: "Conflito trabalho-vida",
          risco_direcao: "direto",
          versoes: ["curto", "medio"],
          itens: [{ id: "TV1", texto: "As exigências do trabalho atrapalham sua vida pessoal e familiar?", reverso: false }],
        },
      ],
    },
    {
      id: "capital_social",
      nome: "Capital social",
      dimensoes: [
        {
          id: "confianca_vertical",
          nome: "Confiança vertical",
          risco_direcao: "inverso",
          versoes: ["medio"],
          itens: [{ id: "CV1", texto: "A gestão confia nos trabalhadores para fazerem bem o seu trabalho?", reverso: true }],
        },
        {
          id: "justica_organizacional",
          nome: "Justiça organizacional",
          risco_direcao: "inverso",
          versoes: ["curto", "medio"],
          itens: [{ id: "JO1", texto: "Os conflitos são resolvidos de maneira justa na sua empresa?", reverso: true }],
        },
      ],
    },
    {
      id: "comportamentos_ofensivos",
      nome: "Comportamentos ofensivos (assédio e violência)",
      dimensoes: [
        {
          id: "assedio_moral",
          nome: "Assédio moral / bullying",
          risco_direcao: "direto",
          versoes: ["curto", "medio"],
          itens: [{ id: "AM1", texto: "Nos últimos 12 meses, você foi exposto(a) a humilhações, perseguições ou hostilidade no trabalho?", reverso: false }],
        },
        {
          id: "assedio_sexual",
          nome: "Assédio sexual",
          risco_direcao: "direto",
          versoes: ["curto", "medio"],
          itens: [{ id: "AX1", texto: "Nos últimos 12 meses, você foi exposto(a) a assédio sexual no trabalho?", reverso: false }],
        },
        {
          id: "violencia",
          nome: "Ameaças e violência",
          risco_direcao: "direto",
          versoes: ["medio"],
          itens: [{ id: "VI1", texto: "Nos últimos 12 meses, você sofreu ameaças ou violência física no trabalho?", reverso: false }],
        },
      ],
    },
  ],
}

/** Achata o instrumento numa lista de itens para uma versão (para render do form). */
export function itensDaVersao(
  versao: "curto" | "medio",
): { id: string; dominio: string; dimensao: string; texto: string; reverso: boolean }[] {
  const out: { id: string; dominio: string; dimensao: string; texto: string; reverso: boolean }[] = []
  for (const dom of COPSOQ_BR.dominios) {
    for (const dim of dom.dimensoes) {
      if (dim.versoes && !dim.versoes.includes(versao)) continue
      for (const it of dim.itens) {
        if (it.versoes && !it.versoes.includes(versao)) continue
        out.push({
          id: it.id,
          dominio: dom.nome,
          dimensao: dim.nome,
          texto: it.texto ?? it.id,
          reverso: !!it.reverso,
        })
      }
    }
  }
  return out
}

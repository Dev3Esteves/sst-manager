/**
 * Instrumento COPSOQ II-Br — versão CURTA (estrutura oficial validada).
 *
 * Estrutura conforme a validação brasileira da versão curta do COPSOQ II:
 *   Gonçalves JS, Moriguchi CS, Chaves TC, Sato TO. "Cross-cultural adaptation
 *   and psychometric properties of the short version of COPSOQ II-Brazil."
 *   Rev Saude Publica. 2021;55:69 — 7 domínios, 11 dimensões, 40 questões,
 *   Likert 5 pontos, classificação favorável/atenção/desfavorável.
 *
 * ⚠️ TEXTO ADAPTADO (oficial=false): os enunciados abaixo foram traduzidos da
 * Tabela 2 do artigo (publicada em inglês) para o português. NÃO são o texto
 * VERBATIM validado — esse consta na tese de Gonçalves (2019, UFSCar) /
 * material suplementar. Pela licença COPSOQ (CC BY-NC-ND), só pode ser
 * distribuído como "COPSOQ II-Br" usando o texto validado sem modificação;
 * substituir pelos enunciados verbatim antes do uso em produção.
 *
 * Escopo de RISCO: incluímos apenas as dimensões de EXPOSIÇÃO (fatores de
 * risco). Os DESFECHOS da versão curta — satisfação (Q13), saúde geral (Q17)
 * e burnout/estresse (Q18-Q19) — são consequência, não fator de risco, e são
 * monitorados à parte (não entram no Inventário do PGR). Item Q1B é o único
 * com pontuação invertida na versão curta.
 */
import type { InstrumentoDef } from "./scoring"

export const ESCALA_LIKERT = {
  rotulos: ["Nunca/quase nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"],
  valores: [0, 25, 50, 75, 100],
} as const

export const CLASSIFICACAO_TERCIS = {
  metodo: "tercis",
  faixas: {
    verde: { min: 0, max: 33.3, rotulo: "Favorável (risco baixo)" },
    amarelo: { min: 33.4, max: 66.6, rotulo: "Requer atenção (risco médio)" },
    vermelho: { min: 66.7, max: 100, rotulo: "Desfavorável (risco alto)" },
  },
  min_respondentes_ghe: 5,
} as const

export const COPSOQ_META = {
  instrumento: "COPSOQ II-Br (curta)",
  versao_schema: "2021.1",
  oficial: false,
  fonte: "Gonçalves et al., Rev Saude Publica 2021;55:69",
} as const

// Em todos os itens desta versão: presentes tanto na curta quanto na média.
const V = ["curto", "medio"]

export const COPSOQ_BR: InstrumentoDef = {
  dominios: [
    {
      id: "exigencias",
      nome: "Exigências no trabalho",
      dimensoes: [
        {
          id: "demandas_trabalho",
          nome: "Demandas no trabalho",
          risco_direcao: "direto",
          versoes: V,
          itens: [
            { id: "Q1A", texto: "Você atrasa a entrega do seu trabalho?", reverso: false, versoes: V },
            { id: "Q1B", texto: "Você tem tempo suficiente para realizar suas tarefas de trabalho?", reverso: true, versoes: V },
            { id: "Q2A", texto: "É necessário manter um ritmo acelerado de trabalho?", reverso: false, versoes: V },
            { id: "Q2B", texto: "Você trabalha em ritmo acelerado durante toda a jornada?", reverso: false, versoes: V },
            { id: "Q3A", texto: "Seu trabalho o coloca em situações emocionalmente desgastantes?", reverso: false, versoes: V },
            { id: "Q3B", texto: "Você precisa lidar com problemas pessoais de outras pessoas como parte do seu trabalho?", reverso: false, versoes: V },
          ],
        },
      ],
    },
    {
      id: "organizacao_conteudo",
      nome: "Organização e conteúdo do trabalho",
      dimensoes: [
        {
          id: "influencia_desenvolvimento",
          nome: "Influência e desenvolvimento",
          risco_direcao: "inverso",
          versoes: V,
          itens: [
            { id: "Q4A", texto: "Você tem alto grau de influência nas decisões sobre o seu trabalho?", reverso: true, versoes: V },
            { id: "Q4B", texto: "Você pode influenciar a quantidade de trabalho atribuída a você?", reverso: true, versoes: V },
            { id: "Q5A", texto: "Você tem a possibilidade de aprender coisas novas por meio do seu trabalho?", reverso: true, versoes: V },
            { id: "Q5B", texto: "Seu trabalho exige que você tome iniciativa?", reverso: true, versoes: V },
          ],
        },
        {
          id: "significado_comprometimento",
          nome: "Significado e comprometimento",
          risco_direcao: "inverso",
          versoes: V,
          itens: [
            { id: "Q6A", texto: "Seu trabalho tem significado para você?", reverso: true, versoes: V },
            { id: "Q6B", texto: "Você sente que o trabalho que realiza é importante?", reverso: true, versoes: V },
            { id: "Q7A", texto: "Você sente que seu local de trabalho é muito importante para você?", reverso: true, versoes: V },
            { id: "Q7B", texto: "Você recomendaria a um(a) amigo(a) se candidatar a uma vaga no seu local de trabalho?", reverso: true, versoes: V },
          ],
        },
      ],
    },
    {
      id: "relacoes_lideranca",
      nome: "Relações interpessoais e liderança",
      dimensoes: [
        {
          id: "relacoes_interpessoais",
          nome: "Relações interpessoais",
          risco_direcao: "inverso",
          versoes: V,
          itens: [
            { id: "Q8A", texto: "No seu local de trabalho, você é informado(a) com antecedência sobre decisões importantes, mudanças ou planos para o futuro?", reverso: true, versoes: V },
            { id: "Q8B", texto: "Você recebe todas as informações de que precisa para fazer bem o seu trabalho?", reverso: true, versoes: V },
            { id: "Q9A", texto: "Seu trabalho é reconhecido e valorizado pela gestão?", reverso: true, versoes: V },
            { id: "Q9B", texto: "Você é tratado(a) de forma justa no seu local de trabalho?", reverso: true, versoes: V },
            { id: "Q10A", texto: "Seu trabalho tem objetivos/metas claros?", reverso: true, versoes: V },
            { id: "Q10B", texto: "Você sabe exatamente o que é esperado de você no trabalho?", reverso: true, versoes: V },
          ],
        },
        {
          id: "lideranca",
          nome: "Qualidade da liderança",
          risco_direcao: "inverso",
          versoes: V,
          itens: [
            { id: "Q11A", texto: "Você diria que seu superior imediato dá alta prioridade à satisfação no trabalho?", reverso: true, versoes: V },
            { id: "Q11B", texto: "Você diria que seu superior é bom no planejamento do trabalho?", reverso: true, versoes: V },
            { id: "Q12A", texto: "Com que frequência seu superior imediato está disposto a ouvir seus problemas no trabalho?", reverso: true, versoes: V },
            { id: "Q12B", texto: "Com que frequência você recebe ajuda e apoio do seu superior imediato?", reverso: true, versoes: V },
          ],
        },
      ],
    },
    {
      id: "interface_individuo",
      nome: "Interface trabalho-indivíduo",
      dimensoes: [
        {
          id: "conflito_trabalho_familia",
          nome: "Conflito trabalho-família",
          risco_direcao: "direto",
          versoes: V,
          itens: [
            { id: "Q14A", texto: "Você sente que seu trabalho consome tanta energia que tem efeito negativo na sua vida pessoal/familiar?", reverso: false, versoes: V },
            { id: "Q14B", texto: "Você sente que seu trabalho consome tanto tempo que tem efeito negativo na sua vida pessoal/familiar?", reverso: false, versoes: V },
          ],
        },
      ],
    },
    {
      id: "valores",
      nome: "Valores no local de trabalho",
      dimensoes: [
        {
          id: "valores_local_trabalho",
          nome: "Confiança e justiça organizacional",
          risco_direcao: "inverso",
          versoes: V,
          itens: [
            { id: "Q15A", texto: "Você pode confiar nas informações que vêm dos seus superiores?", reverso: true, versoes: V },
            { id: "Q15B", texto: "Seus superiores confiam que os empregados farão bem o seu trabalho?", reverso: true, versoes: V },
            { id: "Q16A", texto: "Os conflitos são resolvidos de forma justa?", reverso: true, versoes: V },
            { id: "Q16B", texto: "O trabalho é distribuído de forma justa?", reverso: true, versoes: V },
          ],
        },
      ],
    },
    {
      id: "comportamentos_ofensivos",
      nome: "Comportamentos ofensivos",
      dimensoes: [
        {
          id: "comportamentos_ofensivos",
          nome: "Assédio e violência",
          risco_direcao: "direto",
          versoes: V,
          itens: [
            { id: "Q20", texto: "Nos últimos 12 meses, você foi exposto(a) a atenção sexual indesejada no seu local de trabalho?", reverso: false, versoes: V },
            { id: "Q21", texto: "Nos últimos 12 meses, você foi exposto(a) a ameaças de violência no seu local de trabalho?", reverso: false, versoes: V },
            { id: "Q22", texto: "Nos últimos 12 meses, você foi exposto(a) a violência física no seu local de trabalho?", reverso: false, versoes: V },
            { id: "Q23", texto: "Nos últimos 12 meses, você foi exposto(a) a assédio moral (bullying) no seu local de trabalho?", reverso: false, versoes: V },
          ],
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

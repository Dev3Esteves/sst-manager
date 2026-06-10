/**
 * Instrumento PROART — Protocolo de Avaliação dos Riscos Psicossociais no
 * Trabalho (Facas, UnB, 2013; versão validada com 91 itens).
 *
 * Estrutura (4 escalas, 10 fatores, 91 itens), conforme Facas, E. P. "PROART:
 * Riscos Psicossociais Relacionados ao Trabalho" (Editora Fi):
 *   - Organização do Trabalho (EOT): Divisão das Tarefas (7) + Divisão Social (12) = 19
 *   - Estilos de Gestão (EEG): Estilo Individualista (10) + Estilo Coletivista (11) = 21
 *   - Indicadores de Sofrimento no Trabalho (EIST): Falta de Sentido (9) +
 *     Esgotamento Mental (8) + Falta de Reconhecimento (11) = 28  → DESFECHO
 *   - Danos Relacionados ao Trabalho (EDT): Psicológicos (7) + Sociais (7) +
 *     Físicos (9) = 23  → DESFECHO
 *
 * Escala Likert de frequência 5 pontos (Nunca→Sempre). Direção de risco POR
 * ESCALA (não uniforme):
 *   - POSITIVAS (alto = bom = risco baixo; band 1,00-2,29 = ALTO): Organização do
 *     Trabalho e Estilo Coletivista → itens reverso=true.
 *   - NEGATIVAS (alto = risco alto; band 3,70-5,00 = ALTO): Estilo Individualista,
 *     Sofrimento e Danos → itens reverso=false.
 * Como o motor converte resposta→risco via item.reverso, as faixas em espaço de
 * RISCO ficam ~{32,5 / 67,5} para os três níveis (equivale às bandas do PROART).
 *
 * Sofrimento (EIST) e Danos (EDT) são DESFECHOS (consequências), não fatores de
 * risco: marcados tipo="desfecho" e não alimentam o Inventário do PGR — entram
 * apenas como monitoramento, conforme o modelo teórico do próprio PROART
 * (Organização → Estilos → Sofrimento → Danos).
 *
 * Observação de uso: o PROART original interpreta os Estilos de Gestão por
 * predominância (não por banda de risco); aqui mapeamos Individualista como
 * risco e Coletivista como protetor para integrar ao fluxo GRO/PGR.
 *
 * ⚠️ oficial=false: itens transcritos da obra para uso no produto; revisar com a
 * versão licenciada do protocolo antes do uso definitivo em produção.
 */
import type { InstrumentoDef } from "./scoring"

export const ESCALA_PROART = {
  rotulos: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"],
  valores: [0, 25, 50, 75, 100],
} as const

export const PROART_META = {
  instrumento: "PROART (Riscos Psicossociais)",
  versao_schema: "2013.1",
  oficial: false,
  fonte: "Facas, E. P. — PROART: Riscos Psicossociais Relacionados ao Trabalho (Editora Fi)",
  instrucao:
    "Pense no seu trabalho atual e marque a frequência com que cada situação ocorre.",
} as const

const U = ["unica"]

export const PROART_BR: InstrumentoDef = {
  // Bandas do PROART convertidas para espaço de risco (0-100). reverso cuida da direção.
  faixas: { verdeMax: 32.5, amareloMax: 67.5 },
  dominios: [
    {
      id: "organizacao_trabalho",
      nome: "Organização do Trabalho",
      dimensoes: [
        {
          id: "divisao_tarefas",
          nome: "Divisão das Tarefas",
          risco_direcao: "inverso",
          tipo: "exposicao",
          versoes: U,
          itens: [
            { id: "P1", texto: "Os recursos de trabalho são em número suficiente para a realização das tarefas.", reverso: true, versoes: U },
            { id: "P2", texto: "O número de trabalhadores é suficiente para a execução das tarefas.", reverso: true, versoes: U },
            { id: "P3", texto: "Os equipamentos são adequados para a realização das tarefas.", reverso: true, versoes: U },
            { id: "P4", texto: "O espaço físico disponível para a realização do trabalho é adequado.", reverso: true, versoes: U },
            { id: "P5", texto: "O ritmo de trabalho é adequado.", reverso: true, versoes: U },
            { id: "P6", texto: "Possuo condições adequadas para alcançar os resultados esperados do meu trabalho.", reverso: true, versoes: U },
            { id: "P7", texto: "Os prazos para a realização das tarefas são flexíveis.", reverso: true, versoes: U },
          ],
        },
        {
          id: "divisao_social",
          nome: "Divisão Social do Trabalho",
          risco_direcao: "inverso",
          tipo: "exposicao",
          versoes: U,
          itens: [
            { id: "P8", texto: "A comunicação entre chefe e subordinado é adequada.", reverso: true, versoes: U },
            { id: "P9", texto: "As orientações que me são passadas para realizar as tarefas são coerentes entre si.", reverso: true, versoes: U },
            { id: "P10", texto: "Tenho liberdade para opinar sobre o meu trabalho.", reverso: true, versoes: U },
            { id: "P11", texto: "Os funcionários participam das decisões sobre o trabalho.", reverso: true, versoes: U },
            { id: "P12", texto: "Tenho autonomia para realizar as tarefas como julgo melhor.", reverso: true, versoes: U },
            { id: "P13", texto: "As informações de que preciso para executar minhas tarefas são claras.", reverso: true, versoes: U },
            { id: "P14", texto: "Há qualidade na comunicação entre os funcionários.", reverso: true, versoes: U },
            { id: "P15", texto: "Há justiça na distribuição das tarefas.", reverso: true, versoes: U },
            { id: "P16", texto: "Há clareza na definição das tarefas.", reverso: true, versoes: U },
            { id: "P17", texto: "Há flexibilidade nas normas para a execução das tarefas.", reverso: true, versoes: U },
            { id: "P18", texto: "A avaliação do meu trabalho inclui aspectos além da minha produção.", reverso: true, versoes: U },
            { id: "P19", texto: "As tarefas que executo em meu trabalho são variadas.", reverso: true, versoes: U },
          ],
        },
      ],
    },
    {
      id: "estilos_gestao",
      nome: "Estilos de Gestão",
      dimensoes: [
        {
          id: "estilo_individualista",
          nome: "Estilo Individualista",
          risco_direcao: "direto",
          tipo: "exposicao",
          versoes: U,
          itens: [
            { id: "P20", texto: "Nesta organização os gestores se consideram o centro do mundo.", reverso: false, versoes: U },
            { id: "P21", texto: "Os gestores desta organização se consideram insubstituíveis.", reverso: false, versoes: U },
            { id: "P22", texto: "Os gestores desta organização fazem qualquer coisa para chamar a atenção.", reverso: false, versoes: U },
            { id: "P23", texto: "Aqui os gestores preferem trabalhar individualmente.", reverso: false, versoes: U },
            { id: "P24", texto: "Em meu trabalho, incentiva-se a idolatria dos chefes.", reverso: false, versoes: U },
            { id: "P25", texto: "Há forte controle do trabalho.", reverso: false, versoes: U },
            { id: "P26", texto: "A hierarquia é valorizada nesta organização.", reverso: false, versoes: U },
            { id: "P27", texto: "O ambiente de trabalho se desorganiza com mudanças.", reverso: false, versoes: U },
            { id: "P28", texto: "Os laços afetivos são fracos entre as pessoas desta organização.", reverso: false, versoes: U },
            { id: "P29", texto: "É creditada grande importância para as regras nesta organização.", reverso: false, versoes: U },
          ],
        },
        {
          id: "estilo_coletivista",
          nome: "Estilo Coletivista",
          risco_direcao: "inverso",
          tipo: "exposicao",
          versoes: U,
          itens: [
            { id: "P30", texto: "O trabalho coletivo é valorizado pelos gestores.", reverso: true, versoes: U },
            { id: "P31", texto: "A competência dos trabalhadores é valorizada pela gestão.", reverso: true, versoes: U },
            { id: "P32", texto: "Os gestores se preocupam com o bem-estar dos trabalhadores.", reverso: true, versoes: U },
            { id: "P33", texto: "Para esta organização, o resultado do trabalho é visto como uma realização do grupo.", reverso: true, versoes: U },
            { id: "P34", texto: "O mérito das conquistas na empresa é de todos.", reverso: true, versoes: U },
            { id: "P35", texto: "Somos incentivados pelos gestores a buscar novos desafios.", reverso: true, versoes: U },
            { id: "P36", texto: "A inovação é valorizada nesta organização.", reverso: true, versoes: U },
            { id: "P37", texto: "As decisões nesta organização são tomadas em grupo.", reverso: true, versoes: U },
            { id: "P38", texto: "Os gestores favorecem o trabalho interativo de profissionais de diferentes áreas.", reverso: true, versoes: U },
            { id: "P39", texto: "Existem oportunidades semelhantes de ascensão para todas as pessoas.", reverso: true, versoes: U },
            { id: "P40", texto: "As pessoas são compromissadas com a organização mesmo quando não há retorno adequado.", reverso: true, versoes: U },
          ],
        },
      ],
    },
    {
      id: "sofrimento",
      nome: "Indicadores de Sofrimento no Trabalho",
      dimensoes: [
        {
          id: "falta_sentido",
          nome: "Falta de Sentido do Trabalho",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "P41", texto: "Meu trabalho é sem sentido.", reverso: false, versoes: U },
            { id: "P42", texto: "Meu trabalho é irrelevante para o desenvolvimento da sociedade.", reverso: false, versoes: U },
            { id: "P43", texto: "Minhas tarefas são banais.", reverso: false, versoes: U },
            { id: "P44", texto: "Considero minhas tarefas insignificantes.", reverso: false, versoes: U },
            { id: "P45", texto: "Sinto-me improdutivo no meu trabalho.", reverso: false, versoes: U },
            { id: "P46", texto: "A identificação com minhas tarefas é inexistente.", reverso: false, versoes: U },
            { id: "P47", texto: "Sinto-me inútil em meu trabalho.", reverso: false, versoes: U },
            { id: "P48", texto: "Sinto-me desmotivado para realizar minhas tarefas.", reverso: false, versoes: U },
            { id: "P49", texto: "Permaneço neste emprego por falta de oportunidade no mercado de trabalho.", reverso: false, versoes: U },
          ],
        },
        {
          id: "esgotamento_mental",
          nome: "Esgotamento Mental",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "P50", texto: "Meu trabalho é desgastante.", reverso: false, versoes: U },
            { id: "P51", texto: "Meu trabalho é cansativo.", reverso: false, versoes: U },
            { id: "P52", texto: "Meu trabalho me sobrecarrega.", reverso: false, versoes: U },
            { id: "P53", texto: "Meu trabalho me desanima.", reverso: false, versoes: U },
            { id: "P54", texto: "Meu trabalho me frustra.", reverso: false, versoes: U },
            { id: "P55", texto: "Meu trabalho me faz sofrer.", reverso: false, versoes: U },
            { id: "P56", texto: "Meu trabalho me causa insatisfação.", reverso: false, versoes: U },
            { id: "P57", texto: "Submeter meu trabalho a decisões políticas é fonte de revolta.", reverso: false, versoes: U },
          ],
        },
        {
          id: "falta_reconhecimento",
          nome: "Falta de Reconhecimento",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "P58", texto: "Falta-me liberdade para dialogar com minha chefia.", reverso: false, versoes: U },
            { id: "P59", texto: "Minha chefia trata meu trabalho com indiferença.", reverso: false, versoes: U },
            { id: "P60", texto: "Há desconfiança na relação entre chefia e subordinado.", reverso: false, versoes: U },
            { id: "P61", texto: "O trabalho que realizo é desqualificado pela chefia.", reverso: false, versoes: U },
            { id: "P62", texto: "Sou excluído do planejamento de minhas próprias tarefas.", reverso: false, versoes: U },
            { id: "P63", texto: "Falta-me liberdade para dizer o que penso sobre meu trabalho.", reverso: false, versoes: U },
            { id: "P64", texto: "Meus colegas são indiferentes comigo.", reverso: false, versoes: U },
            { id: "P65", texto: "Meus colegas desvalorizam meu trabalho.", reverso: false, versoes: U },
            { id: "P66", texto: "É difícil a convivência com meus colegas.", reverso: false, versoes: U },
            { id: "P67", texto: "A submissão do meu chefe a ordens superiores me causa revolta.", reverso: false, versoes: U },
            { id: "P68", texto: "Meu trabalho é desvalorizado pela organização.", reverso: false, versoes: U },
          ],
        },
      ],
    },
    {
      id: "danos",
      nome: "Danos Relacionados ao Trabalho",
      dimensoes: [
        {
          id: "danos_psicologicos",
          nome: "Danos Psicológicos",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "P69", texto: "Sensação de vazio.", reverso: false, versoes: U },
            { id: "P70", texto: "Amargura.", reverso: false, versoes: U },
            { id: "P71", texto: "Tristeza.", reverso: false, versoes: U },
            { id: "P72", texto: "Vontade de desistir de tudo.", reverso: false, versoes: U },
            { id: "P73", texto: "Perda da autoconfiança.", reverso: false, versoes: U },
            { id: "P74", texto: "Solidão.", reverso: false, versoes: U },
            { id: "P75", texto: "Mau humor.", reverso: false, versoes: U },
          ],
        },
        {
          id: "danos_sociais",
          nome: "Danos Sociais",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "P76", texto: "Dificuldade com os amigos.", reverso: false, versoes: U },
            { id: "P77", texto: "Conflitos nas relações familiares.", reverso: false, versoes: U },
            { id: "P78", texto: "Agressividade com os outros.", reverso: false, versoes: U },
            { id: "P79", texto: "Dificuldades nas relações fora do trabalho.", reverso: false, versoes: U },
            { id: "P80", texto: "Impaciência com as pessoas em geral.", reverso: false, versoes: U },
            { id: "P81", texto: "Vontade de ficar sozinho.", reverso: false, versoes: U },
            { id: "P82", texto: "Insensibilidade em relação aos colegas.", reverso: false, versoes: U },
          ],
        },
        {
          id: "danos_fisicos",
          nome: "Danos Físicos",
          risco_direcao: "direto",
          tipo: "desfecho",
          versoes: U,
          itens: [
            { id: "P83", texto: "Dores nas pernas.", reverso: false, versoes: U },
            { id: "P84", texto: "Dores nas costas.", reverso: false, versoes: U },
            { id: "P85", texto: "Dores no corpo.", reverso: false, versoes: U },
            { id: "P86", texto: "Dores no braço.", reverso: false, versoes: U },
            { id: "P87", texto: "Distúrbios circulatórios.", reverso: false, versoes: U },
            { id: "P88", texto: "Dor de cabeça.", reverso: false, versoes: U },
            { id: "P89", texto: "Distúrbios digestivos.", reverso: false, versoes: U },
            { id: "P90", texto: "Alterações no sono.", reverso: false, versoes: U },
            { id: "P91", texto: "Alterações no apetite.", reverso: false, versoes: U },
          ],
        },
      ],
    },
  ],
}

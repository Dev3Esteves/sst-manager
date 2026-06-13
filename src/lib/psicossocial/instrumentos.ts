/**
 * Registro central de instrumentos psicossociais. Une as definições de código
 * (COPSOQ, HSE-IT, ...) e expõe o que o fluxo precisa: lista para a UI, escala
 * de resposta por instrumento e o JSONB de `definicao` a ser gravado em
 * psi_instrumento (tornando o formulário público e o cálculo data-driven).
 */
import { COPSOQ_BR, ESCALA_LIKERT, COPSOQ_META } from "./copsoq"
import { HSE_IT_BR, ESCALA_HSE, HSE_META } from "./hse"
import { PROART_BR, ESCALA_PROART, PROART_META } from "./proart"
import { CBI_BR, ESCALA_CBI, CBI_META } from "./cbi"
import { DASS21_BR, ESCALA_DASS, DASS_META } from "./dass"
import type { InstrumentoDef } from "./scoring"

export type EscalaDef = { rotulos: string[]; valores: number[] }
export type VersaoOpt = { value: string; label: string }

export type NaturezaInstrumento = "exposicao" | "desfecho" | "misto"

export type InstrumentoRegistro = {
  key: string
  nome: string
  versao_schema: string
  oficial: boolean
  fonte: string
  instrucao: string
  /** Natureza p/ a NR-1: exposição alimenta o PGR; desfecho é só monitoramento. */
  natureza: NaturezaInstrumento
  /**
   * Se as faixas podem ser calibradas pelos percentis da empresa (norma
   * relativa). true para cortes arbitrários (tercis: COPSOQ, HSE). false para
   * cortes ANCORADOS (PROART/protocolo; CBI/DASS clínicos) — recalibrar
   * destruiria o significado absoluto da escala.
   */
  calibravel: boolean
  /** Resumo curto exibido na UI (o que mede / vai ou não ao PGR). */
  resumo: string
  versoes: VersaoOpt[]
  def: InstrumentoDef
  escala: EscalaDef
}

export const NATUREZA_LABEL: Record<NaturezaInstrumento, string> = {
  exposicao: "Exposição — vai ao Inventário do PGR",
  desfecho: "Desfecho — monitoramento (não vai ao PGR)",
  misto: "Misto — exposição (PGR) + desfecho (monitoramento)",
}

export const INSTRUMENTOS: InstrumentoRegistro[] = [
  {
    key: "copsoq",
    nome: COPSOQ_META.instrumento,
    versao_schema: COPSOQ_META.versao_schema,
    oficial: COPSOQ_META.oficial,
    fonte: COPSOQ_META.fonte,
    natureza: "exposicao",
    calibravel: true,
    resumo: "Copenhagen Psychosocial Questionnaire (8 dimensões). Mede fatores psicossociais do trabalho; alimenta o Inventário do PGR.",
    instrucao: "Pense nas suas condições de trabalho nas últimas semanas e marque a frequência.",
    versoes: [
      { value: "curto", label: "Curta (frentes de obra)" },
      { value: "medio", label: "Média (padrão)" },
    ],
    def: COPSOQ_BR,
    escala: { rotulos: [...ESCALA_LIKERT.rotulos], valores: [...ESCALA_LIKERT.valores] },
  },
  {
    key: "hse",
    nome: HSE_META.instrumento,
    versao_schema: HSE_META.versao_schema,
    oficial: HSE_META.oficial,
    fonte: HSE_META.fonte,
    natureza: "exposicao",
    calibravel: true,
    resumo: "HSE Management Standards (7 dimensões: demandas, controle, apoio, relacionamentos, função, mudança). Alimenta o PGR.",
    instrucao: HSE_META.instrucao,
    versoes: [{ value: "unica", label: "Única (35 itens, 7 dimensões)" }],
    def: HSE_IT_BR,
    escala: { rotulos: [...ESCALA_HSE.rotulos], valores: [...ESCALA_HSE.valores] },
  },
  {
    key: "proart",
    nome: PROART_META.instrumento,
    versao_schema: PROART_META.versao_schema,
    oficial: PROART_META.oficial,
    fonte: PROART_META.fonte,
    natureza: "misto",
    calibravel: false,
    resumo: "Protocolo de Avaliação dos Riscos Psicossociais no Trabalho. Organização e estilos de gestão = exposição (PGR); sofrimento e danos = desfecho (monitoramento).",
    instrucao: PROART_META.instrucao,
    versoes: [{ value: "unica", label: "Única (91 itens, 4 escalas)" }],
    def: PROART_BR,
    escala: { rotulos: [...ESCALA_PROART.rotulos], valores: [...ESCALA_PROART.valores] },
  },
  {
    key: "cbi",
    nome: CBI_META.instrumento,
    versao_schema: CBI_META.versao_schema,
    oficial: CBI_META.oficial,
    fonte: CBI_META.fonte,
    natureza: "desfecho",
    calibravel: false,
    resumo: "Copenhagen Burnout Inventory (burnout pessoal/trabalho/cliente). Desfecho — usado para monitoramento; não vai ao PGR.",
    instrucao: CBI_META.instrucao,
    versoes: [{ value: "unica", label: "Única (19 itens — burnout)" }],
    def: CBI_BR,
    escala: { rotulos: [...ESCALA_CBI.rotulos], valores: [...ESCALA_CBI.valores] },
  },
  {
    key: "dass21",
    nome: DASS_META.instrumento,
    versao_schema: DASS_META.versao_schema,
    oficial: DASS_META.oficial,
    fonte: DASS_META.fonte,
    natureza: "desfecho",
    calibravel: false,
    resumo: "DASS-21 — depressão, ansiedade e estresse (3 subescalas). Desfecho — monitoramento da saúde do grupo; não vai ao PGR.",
    instrucao: DASS_META.instrucao,
    versoes: [{ value: "unica", label: "Única (21 itens — D/A/E)" }],
    def: DASS21_BR,
    escala: { rotulos: [...ESCALA_DASS.rotulos], valores: [...ESCALA_DASS.valores] },
  },
]

export const INSTRUMENTO_PADRAO = "copsoq"

export function getInstrumento(key: string): InstrumentoRegistro | undefined {
  return INSTRUMENTOS.find((i) => i.key === key)
}

/** Forma da `definicao` lida do banco (InstrumentoDef + metadados de render). */
export type DefinicaoArmazenada = InstrumentoDef & {
  key?: string
  nome?: string
  instrucao?: string
  escala?: EscalaDef
}

/** Monta o JSONB de `definicao` a gravar em psi_instrumento (def + escala + key). */
export function definicaoArmazenada(reg: InstrumentoRegistro): DefinicaoArmazenada {
  return {
    key: reg.key,
    nome: reg.nome,
    instrucao: reg.instrucao,
    escala: reg.escala,
    ...reg.def,
  }
}

/** Escala padrão (COPSOQ) usada como fallback quando a definicao não a traz. */
export const ESCALA_PADRAO: EscalaDef = {
  rotulos: [...ESCALA_LIKERT.rotulos],
  valores: [...ESCALA_LIKERT.valores],
}

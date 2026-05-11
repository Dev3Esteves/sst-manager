// Indicadores de SST conforme ABNT NBR 14280:2001 (Cadastro de Acidente do Trabalho).
//
// Fórmulas e diretrizes:
//   - HHT (Horas-Homem Trabalhadas): somatório das horas efetivamente trabalhadas
//     no período. Afastamentos, férias e faltas NÃO contam. Horas-extras CONTAM.
//   - Sem integração com folha de pagamento, este módulo provê um ESTIMADOR
//     baseado em (colaboradores ativos × jornada mensal padrão) menos as horas
//     correspondentes a afastamentos contabilizados no período. Substituir por
//     leitura real da folha quando a integração existir (roadmap Sprint A).
//
// Referências:
//   - NBR 14280:2001 (Versão Corrigida 2:2003) — define base de 1.000.000 h.
//   - OSHA (29 CFR 1904) — usa base de 200.000 h (LTIR/TRIR/DART).
//   - docs/referencias-software.md §6 (Indicadores)

/** Base de cálculo NBR 14280 (Brasil): 1.000.000 horas-homem. */
export const BASE_HORAS_NBR_14280 = 1_000_000

/** Base de cálculo OSHA (EUA): 200.000 horas-homem (100 trab × 50 sem × 40h). */
export const BASE_HORAS_OSHA = 200_000

/** Jornada mensal padrão CLT (44h semanais × ~5 semanas). */
export const JORNADA_MENSAL_PADRAO_HORAS = 220

/** Jornada diária padrão CLT (8h). Usada para converter dias de afastamento em horas. */
export const JORNADA_DIARIA_PADRAO_HORAS = 8

export type HHTInput = {
  /** Colaboradores com vínculo ativo no período. */
  colaboradoresAtivos: number
  /** Jornada mensal de referência. Padrão: 220h (CLT 44h/sem). */
  jornadaMensalHoras?: number
  /** Horas correspondentes a afastamentos a descontar do total. */
  horasAfastadas?: number
}

/**
 * Estimativa de HHT (Horas-Homem Trabalhadas) no período.
 *
 * Fórmula:
 *   HHT ≈ colaboradoresAtivos × jornadaMensalHoras − horasAfastadas
 *
 * Retorna sempre ≥ 0 (afastadas > teórico ⇒ 0, não negativo).
 */
export function calcularHHT(input: HHTInput): number {
  const jornada = input.jornadaMensalHoras ?? JORNADA_MENSAL_PADRAO_HORAS
  const afastadas = input.horasAfastadas ?? 0
  return Math.max(0, input.colaboradoresAtivos * jornada - afastadas)
}

/**
 * Converte dias de afastamento em horas usando jornada diária padrão.
 * Útil para alimentar `horasAfastadas` em `calcularHHT`.
 */
export function diasParaHoras(dias: number, jornadaDiariaHoras = JORNADA_DIARIA_PADRAO_HORAS): number {
  return Math.max(0, dias) * jornadaDiariaHoras
}

/**
 * Taxa de Frequência (TF) — NBR 14280.
 *
 *   TF = (acidentes com lesão × 1.000.000) / HHT
 *
 * "Acidentes com lesão" = acidentes típicos ou de trajeto que resultaram em
 * afastamento ou lesão registrável. Quase-acidentes NÃO entram em TF.
 *
 * Retorna 0 se HHT ≤ 0 (evita divisão por zero em meses sem dados).
 */
export function calcularTF(acidentesComLesao: number, hht: number): number {
  if (hht <= 0) return 0
  return (acidentesComLesao * BASE_HORAS_NBR_14280) / hht
}

/**
 * Taxa de Gravidade (TG) — NBR 14280.
 *
 *   TG = ((dias perdidos + dias debitados) × 1.000.000) / HHT
 *
 * - `diasPerdidos`: dias efetivos de afastamento (campo `ocorrencias.dias_afastamento`).
 * - `diasDebitados`: dias atribuídos por incapacidade permanente ou morte conforme
 *   tabela da NBR 14280 (ex.: morte = 6.000; perda total da visão = 6.000).
 *   Sem catálogo de dias debitados implementado no app, passar 0 (subestima TG
 *   em casos de morte/invalidez — roadmap Sprint A para catalogar).
 *
 * Retorna 0 se HHT ≤ 0.
 */
export function calcularTG(diasPerdidos: number, diasDebitados: number, hht: number): number {
  if (hht <= 0) return 0
  return ((diasPerdidos + diasDebitados) * BASE_HORAS_NBR_14280) / hht
}

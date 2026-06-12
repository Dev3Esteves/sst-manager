/**
 * Pesquisa qualitativa psicossocial — perguntas abertas que complementam o
 * questionário quantitativo (NR-01 recomenda triangulação). As respostas são
 * anônimas e analisadas de forma agregada (síntese por IA + k-anonimato).
 */

/** Template fixo de perguntas abertas (usado quando a campanha não define o seu). */
export const PERGUNTAS_QUALITATIVAS_PADRAO: string[] = [
  "O que mais sobrecarrega ou dificulta o seu trabalho atualmente?",
  "O que poderia melhorar suas condições de trabalho e bem-estar?",
  "Há alguma situação de pressão excessiva, desrespeito ou conflito que você queira relatar? (opcional)",
]

/** Aviso de anonimato exibido na etapa qualitativa do formulário público. */
export const INSTRUCAO_QUALITATIVA =
  "Responda com suas palavras. Não escreva nomes de pessoas — suas respostas são anônimas e " +
  "analisadas de forma agregada por grupo, conforme a NR-01 e a LGPD."

export type ModoQualitativo = "nenhum" | "integrado" | "separado"

/** Resolve as perguntas de uma campanha (campo salvo ou template padrão). */
export function perguntasDaCampanha(perguntas: unknown): string[] {
  if (Array.isArray(perguntas) && perguntas.every((p) => typeof p === "string") && perguntas.length > 0) {
    return perguntas as string[]
  }
  return PERGUNTAS_QUALITATIVAS_PADRAO
}

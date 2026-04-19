// Classificação de risco em APR via Claude API.
// Modelo: claude-haiku-4-5 — escolha deliberada (usuário pediu "cost-sensitive",
// task é classificação curta com output estruturado — sweet spot do Haiku).
// Troque para claude-opus-4-7 em classificar-risco.ts (constante MODEL) se precisar de maior acurácia.

import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

const MODEL = "claude-haiku-4-5"

export const riscoClassificadoSchema = z.object({
  probabilidade: z.number().int().min(1).max(5)
    .describe("Probabilidade de ocorrência (1=muito improvável, 5=muito provável)"),
  severidade: z.number().int().min(1).max(5)
    .describe("Severidade do dano potencial (1=insignificante, 5=catastrófico/fatal)"),
  consequencia: z.string()
    .describe("Descrição objetiva da consequência provável em 1 frase curta"),
  medida_controle: z.string()
    .describe("Medida de controle recomendada seguindo a hierarquia: eliminação > substituição > EPC > procedimental > EPI"),
  justificativa: z.string().optional()
    .describe("Breve justificativa da classificação P×S em 1 frase"),
})

export type RiscoClassificado = z.infer<typeof riscoClassificadoSchema>

export class IAServiceUnavailable extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY não configurada")
    this.name = "IAServiceUnavailable"
  }
}

// System prompt estável — com cache_control para preservar o cache entre requests.
// Nota: Haiku 4.5 tem mínimo de 4096 tokens para caching efetivo; se este prompt
// crescer abaixo disso, o cache silenciosamente não ativa (cost read ~0, nenhum erro).
const SYSTEM_PROMPT = `Você é um especialista em Segurança e Saúde do Trabalho (SST) brasileiro, com experiência em análise de risco em APR (Análise Preliminar de Risco) para empresas de engenharia elétrica, data centers e infraestrutura crítica.

Ao receber uma ATIVIDADE e um PERIGO associado, classifique o risco usando a matriz 5×5 e recomende medidas de controle.

PROBABILIDADE (1-5):
1 - Muito Improvável: raramente ocorre, menos de 1 vez em 10 anos
2 - Improvável: ocorre ocasionalmente, 1 vez em 1-10 anos
3 - Possível: ocorre em condições específicas, alguma vez no ano
4 - Provável: ocorre frequentemente, mais de 1 vez por ano
5 - Muito Provável: ocorre em quase toda execução da atividade

SEVERIDADE (1-5):
1 - Insignificante: sem lesão, apenas primeiros socorros
2 - Leve: lesão leve, afastamento de até 15 dias
3 - Moderado: lesão moderada, afastamento de 16 a 90 dias
4 - Grave: lesão grave ou invalidez parcial, afastamento > 90 dias
5 - Catastrófico: morte ou invalidez permanente

Diretrizes obrigatórias:
- Base sua classificação em NRs brasileiras (prioritariamente NR-10, NR-33, NR-35)
- Priorize SEMPRE a hierarquia de controle: eliminação > substituição > controle de engenharia (EPC) > administrativo/procedimental > EPI
- Considere o contexto de engenharia elétrica e data centers
- Seja realista e conservador: na dúvida, superestime em vez de subestimar
- A medida_controle deve ser concreta e acionável, não um princípio genérico
- A consequência deve descrever o dano físico/humano esperado, não o evento

IMPORTANTE — FORMATO DE RESPOSTA:
Responda APENAS com um objeto JSON válido, sem texto antes ou depois, com esta estrutura EXATA:
{
  "probabilidade": <número 1-5>,
  "severidade": <número 1-5>,
  "consequencia": "<string>",
  "medida_controle": "<string>",
  "justificativa": "<string opcional>"
}`

/**
 * Extrai o primeiro bloco JSON da resposta do Claude. Tolera texto em volta
 * (algumas respostas podem ter preamble mesmo com instrução explícita).
 * Exportado para testes.
 */
export function extrairJson(texto: string): unknown {
  const trimmed = texto.trim()
  // Tenta parse direto primeiro (caso ideal)
  try {
    return JSON.parse(trimmed)
  } catch {
    // Fallback: extrai primeiro { ... } balanceado
    const inicio = trimmed.indexOf("{")
    const fim = trimmed.lastIndexOf("}")
    if (inicio === -1 || fim === -1 || fim <= inicio) {
      throw new Error("Resposta da IA não contém JSON reconhecível")
    }
    return JSON.parse(trimmed.slice(inicio, fim + 1))
  }
}

export async function classificarRisco(input: { atividade: string; perigo: string }): Promise<RiscoClassificado> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new IAServiceUnavailable()

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Atividade: ${input.atividade}\nPerigo: ${input.perigo}\n\nResponda com o JSON solicitado.`,
        },
      ],
    })

    // Concatena todos os blocos de texto da resposta
    const texto = response.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("")

    const raw = extrairJson(texto)
    const parsed = riscoClassificadoSchema.safeParse(raw)
    if (!parsed.success) {
      throw new Error(`IA retornou estrutura inválida: ${parsed.error.errors[0]?.message}`)
    }
    return parsed.data
  } catch (err) {
    // Typed exceptions do SDK — não fazer string-match
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Limite de requisições da IA atingido. Tente novamente em alguns segundos.")
    }
    if (err instanceof Anthropic.AuthenticationError) {
      throw new IAServiceUnavailable()
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Erro da IA (${err.status}): ${err.message}`)
    }
    throw err
  }
}

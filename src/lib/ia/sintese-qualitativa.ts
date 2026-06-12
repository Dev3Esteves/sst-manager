// Síntese temática das respostas abertas da pesquisa qualitativa psicossocial via Claude.
// Mesmo padrão de classificar-risco.ts (SDK, JSON estruturado, erros tipados).
// Modelo: claude-haiku-4-5 — tarefa de sumarização/categorização, custo-sensível.
// IMPORTANTE p/ LGPD: o prompt instrui a DE-IDENTIFICAR (remover nomes/dados pessoais)
// e a sinalizar respostas que possam conter identificação.

import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { extrairJson, IAServiceUnavailable } from "./classificar-risco"

const MODEL = "claude-haiku-4-5"

export const sinteseQualitativaSchema = z.object({
  temas: z
    .array(
      z.object({
        titulo: z.string().describe("Nome curto do tema (ex.: 'Carga de trabalho', 'Comunicação com a liderança')"),
        frequencia: z.number().int().min(1).describe("Quantas respostas tocam neste tema"),
        resumo: z.string().describe("Resumo objetivo do que os respondentes relataram, sem identificar ninguém"),
        exemplos: z.array(z.string()).describe("Até 3 trechos DE-IDENTIFICADOS que ilustram o tema"),
      }),
    )
    .describe("Temas recorrentes, do mais para o menos frequente"),
  alertas_identificacao: z
    .array(z.string())
    .describe("Avisos sobre respostas que podem conter dados identificáveis (nomes, situações únicas)"),
  sugestoes_acao: z
    .array(z.string())
    .describe("Sugestões de ação/PDCA para o PGR, derivadas dos temas"),
})

export type SinteseQualitativa = z.infer<typeof sinteseQualitativaSchema>

export type RespostaAberta = { pergunta: string; texto: string }

const SYSTEM_PROMPT = `Você é um especialista brasileiro em saúde ocupacional e fatores psicossociais do trabalho (NR-01, NR-17), analisando respostas ABERTAS e ANÔNIMAS de uma pesquisa aplicada a um grupo de trabalhadores (GHE).

Sua tarefa: sintetizar as respostas em TEMAS recorrentes, de forma agregada e útil para o plano de ação do PGR.

REGRAS OBRIGATÓRIAS (LGPD / anonimato):
- NUNCA reproduza nomes de pessoas, apelidos, cargos individualizados ou qualquer dado que identifique alguém. Substitua por termos genéricos ("a liderança", "um colega", "o setor").
- Os "exemplos" devem ser DE-IDENTIFICADOS e curtos. Se um trecho não puder ser de-identificado com segurança, não o use como exemplo.
- Em "alertas_identificacao", liste (descrevendo, sem reproduzir o dado) respostas que pareçam conter informação identificável, para revisão humana.
- Seja fiel ao conteúdo: não invente temas que não aparecem. "frequencia" reflete quantas respostas tocam o tema.
- "sugestoes_acao" devem ser concretas e acionáveis (hierarquia: organização do trabalho > medidas coletivas > apoio), conectadas aos temas.
- Responda em português do Brasil.

FORMATO DE RESPOSTA: APENAS um objeto JSON válido, sem texto antes ou depois:
{
  "temas": [{ "titulo": "<string>", "frequencia": <int>, "resumo": "<string>", "exemplos": ["<string>"] }],
  "alertas_identificacao": ["<string>"],
  "sugestoes_acao": ["<string>"]
}`

export async function sintetizarQualitativo(input: {
  perguntas: string[]
  respostas: RespostaAberta[]
}): Promise<SinteseQualitativa> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new IAServiceUnavailable()

  const client = new Anthropic({ apiKey })

  const corpo = input.respostas
    .map((r, i) => `#${i + 1} [${r.pergunta}]\n${r.texto}`)
    .join("\n\n")
  const userContent =
    `Perguntas aplicadas:\n${input.perguntas.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n` +
    `Respostas anônimas do grupo (total ${input.respostas.length}):\n${corpo}\n\n` +
    `Sintetize em temas conforme as regras e responda com o JSON solicitado.`

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userContent }],
    })

    const texto = response.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("")

    const parsed = sinteseQualitativaSchema.safeParse(extrairJson(texto))
    if (!parsed.success) {
      throw new Error(`IA retornou estrutura inválida: ${parsed.error.errors[0]?.message}`)
    }
    return parsed.data
  } catch (err) {
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

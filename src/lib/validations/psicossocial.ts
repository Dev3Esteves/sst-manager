import { z } from "zod"

/** Criação/edição de campanha psicossocial (autenticado, admin/tec_seguranca). */
export const campanhaPsiSchema = z.object({
  pgr_id: z.string().uuid("PGR obrigatório"),
  // Chave do instrumento no registro (copsoq, hse, ...). O instrumento_id real
  // é resolvido/garantido no servidor a partir desta chave.
  instrumento_key: z.string().min(1).default("copsoq"),
  titulo: z.string().min(3, "Mínimo 3 caracteres"),
  // Versão é específica do instrumento (ex.: COPSOQ curto/medio; HSE única).
  versao_aplicada: z.string().min(1).default("curto"),
  data_inicio: z.string().min(1, "Data de início obrigatória"),
  data_fim: z.string().optional().nullable(),
  min_respondentes: z.coerce.number().int().min(3).max(50).default(5),
  // Pesquisa qualitativa: nenhum | integrado (abertas + Likert) | separado (só abertas)
  modo_qualitativo: z.enum(["nenhum", "integrado", "separado"]).default("nenhum"),
})

export type CampanhaPsiInput = z.infer<typeof campanhaPsiSchema>

/** Submissão anônima de resposta (rota pública /q/[token]). */
export const respostaPsiSchema = z.object({
  token: z.string().min(10, "Token inválido"),
  // demografia opcional e agregável — nunca identificável
  faixa_etaria: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional().nullable(),
  sexo: z.enum(["masculino", "feminino", "outro", "prefiro_nao_informar"]).optional().nullable(),
  itens: z
    .array(
      z.object({
        item_id: z.string().min(1),
        valor: z.coerce.number().int().min(0).max(100),
      }),
    )
    .min(1, "Responda pelo menos um item"),
})

export type RespostaPsiInput = z.infer<typeof respostaPsiSchema>

/** Submissão anônima das respostas abertas (pesquisa qualitativa). */
export const respostaQualitativaSchema = z.object({
  token: z.string().min(10, "Token inválido"),
  respostas: z
    .array(
      z.object({
        pergunta_idx: z.coerce.number().int().min(0),
        pergunta_texto: z.string().min(1),
        resposta_texto: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1, "Responda pelo menos uma pergunta"),
})

export type RespostaQualitativaInput = z.infer<typeof respostaQualitativaSchema>

export const FAIXAS_ETARIAS = ["18-24", "25-34", "35-44", "45-54", "55+"] as const
export const SEXOS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar" },
] as const

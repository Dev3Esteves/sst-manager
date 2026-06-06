import { z } from "zod"

export const MUDANCA_TIPOS: Record<string, string> = {
  produto_processo: "Produto / processo / serviço",
  local_trabalho: "Local de trabalho / entorno",
  organizacao_trabalho: "Organização do trabalho",
  condicoes_trabalho: "Condições de trabalho",
  equipamento: "Equipamento",
  pessoal: "Pessoal / força de trabalho",
  requisito_legal: "Requisito legal / outro requisito",
  conhecimento_tecnologia: "Conhecimento / tecnologia",
  outro: "Outro",
}

export const MUDANCA_STATUS: Record<string, string> = {
  proposta: "Proposta",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  implementada: "Implementada",
  em_monitoramento: "Em monitoramento",
  concluida: "Concluída",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
}

export const gestaoMudancaSchema = z.object({
  titulo: z.string().min(3, "Título obrigatório"),
  descricao: z.string().min(5, "Descreva a mudança"),
  tipo: z.enum([
    "produto_processo", "local_trabalho", "organizacao_trabalho", "condicoes_trabalho",
    "equipamento", "pessoal", "requisito_legal", "conhecimento_tecnologia", "outro",
  ]),
  carater: z.enum(["temporaria", "permanente"]).default("permanente"),
  motivo: z.string().optional().nullable(),
  data_prevista: z.string().optional().nullable(),
  obra_id: z.string().uuid().optional().nullable(),
  perigos_riscos: z.string().optional().nullable(),
  medidas_controle: z.string().optional().nullable(),
  comunicacao: z.string().optional().nullable(),
  data_implementacao: z.string().optional().nullable(),
  avaliacao_pos: z.string().optional().nullable(),
  responsavel_nome: z.string().optional().nullable(),
  envolve_aquisicao: z.boolean().default(false),
  criterios_aquisicao: z.string().optional().nullable(),
  adkar_consciencia: z.string().optional().nullable(),
  adkar_desejo: z.string().optional().nullable(),
  adkar_conhecimento: z.string().optional().nullable(),
  adkar_habilidade: z.string().optional().nullable(),
  adkar_reforco: z.string().optional().nullable(),
  status: z.enum([
    "proposta", "em_analise", "aprovada", "implementada", "em_monitoramento", "concluida", "rejeitada", "cancelada",
  ]).default("proposta"),
})

export type GestaoMudancaInput = z.infer<typeof gestaoMudancaSchema>

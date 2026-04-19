import { z } from "zod"

export const riscoItemSchema = z.object({
  atividade: z.string().min(1),
  perigo: z.string().min(1),
  consequencia: z.string().min(1),
  probabilidade: z.coerce.number().int().min(1).max(5),
  severidade: z.coerce.number().int().min(1).max(5),
  medida_controle: z.string().min(1),
  responsavel: z.string().min(1),
})

export const aprSchema = z.object({
  empresa_id: z.string().uuid(),
  local_trabalho: z.string().min(1, "Local obrigatório"),
  data_emissao: z.string().min(1),
  data_validade: z.string().optional().nullable(),
  equipe: z.array(z.string().min(1)).min(1, "Informe ao menos 1 participante"),
  riscos: z.array(riscoItemSchema).min(1, "Informe ao menos 1 risco"),
  epis: z.array(z.string()).default([]),
  observacoes: z.string().optional().nullable(),
})

export type AprInput = z.infer<typeof aprSchema>

export const autorizacaoNrSchema = z.object({
  nr: z.enum(["NR-10", "NR-35", "NR-33"]),
  empresa_id: z.string().uuid(),
  colaborador_id: z.string().uuid(),
  data_emissao: z.string().min(1),
  data_validade: z.string().optional().nullable(),
  escopo_autorizacao: z.string().min(5, "Descreva o escopo"),
  responsavel_nome: z.string().min(2),
  responsavel_cargo: z.string().min(2),
})

export type AutorizacaoNrInput = z.infer<typeof autorizacaoNrSchema>

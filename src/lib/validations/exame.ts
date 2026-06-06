import { z } from "zod"

export const exameSchema = z.object({
  colaborador_id: z.string().uuid("Colaborador obrigatório"),
  tipo: z.enum(["admissional", "periodico", "retorno_trabalho", "mudanca_funcao", "demissional", "complementar"]),
  subtipo: z.string().optional().nullable(),
  data_realizacao: z.string().min(1, "Data de realização obrigatória"),
  data_vencimento: z.string().min(1, "Data de vencimento obrigatória"),
  resultado: z.enum(["apto", "inapto", "apto_restricao"]).optional().nullable(),
  restricoes: z.string().optional().nullable(),
  medico_nome: z.string().optional().nullable(),
  crm: z.string().optional().nullable(),
  clinica: z.string().optional().nullable(),
  medico_id: z.string().uuid().optional().nullable(),
  clinica_id: z.string().uuid().optional().nullable(),
  numero_aso: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export type ExameInput = z.infer<typeof exameSchema>

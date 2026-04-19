import { z } from "zod"

export const treinamentoSchema = z.object({
  titulo: z.string().min(3, "Mínimo 3 caracteres"),
  nr_referencia: z.string().optional().nullable(),
  carga_horaria_horas: z.coerce.number().positive("Carga horária deve ser > 0"),
  validade_meses: z.coerce.number().int().min(0).optional().nullable(),
  tipo: z.enum(["obrigatorio", "reciclagem", "complementar", "integracao"]),
  modalidade: z.enum(["presencial", "ead", "hibrido"]),
  texto_certificado: z.string().optional().nullable(),
  cidade_emissao: z.string().optional().nullable(),
  conteudo_programatico: z.array(z.string()).optional().default([]),
})

export type TreinamentoInput = z.infer<typeof treinamentoSchema>

export const treinamentoRealizadoSchema = z.object({
  colaborador_id: z.string().uuid("Colaborador obrigatório"),
  treinamento_id: z.string().uuid("Treinamento obrigatório"),
  data_realizacao: z.string().min(1, "Data obrigatória"),
  instrutor: z.string().optional().nullable(),
  entidade: z.string().optional().nullable(),
  local: z.string().optional().nullable(),
  nota_avaliacao: z.coerce.number().min(0).max(10).optional().nullable(),
})

export type TreinamentoRealizadoInput = z.infer<typeof treinamentoRealizadoSchema>

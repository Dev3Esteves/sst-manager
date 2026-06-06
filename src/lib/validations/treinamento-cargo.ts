import { z } from "zod"

/** Matriz função→treinamentos obrigatórios (substitui o conjunto do cargo). */
export const matrizTreinamentoCargoSchema = z.object({
  cargo_id: z.string().uuid("Cargo obrigatório"),
  treinamento_ids: z.array(z.string().uuid()),
})
export type MatrizTreinamentoCargoInput = z.infer<typeof matrizTreinamentoCargoSchema>

/** Aplicar um treinamento a vários colaboradores de uma vez. */
export const treinamentoLoteSchema = z.object({
  treinamento_id: z.string().uuid("Treinamento obrigatório"),
  data_realizacao: z.string().min(1, "Data obrigatória"),
  instrutor: z.string().optional().nullable(),
  entidade: z.string().optional().nullable(),
  instrutor_id: z.string().uuid().optional().nullable(),
  entidade_id: z.string().uuid().optional().nullable(),
  local: z.string().optional().nullable(),
  colaborador_ids: z.array(z.string().uuid()).min(1, "Selecione ao menos 1 colaborador"),
})
export type TreinamentoLoteInput = z.infer<typeof treinamentoLoteSchema>

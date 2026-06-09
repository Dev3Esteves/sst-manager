import { z } from "zod"

/**
 * Contrato de integração com o People (RH) (anti-corruption layer).
 *
 * Estes schemas definem o formato ESPERADO dos eventos do People. Quando o
 * People for vinculado e seu contrato real for conhecido, ajuste aqui (e só
 * aqui) — o resto do sistema não conhece o People diretamente.
 *
 * O People é a FONTE DA VERDADE de cargos, colaboradores e exames. As chaves
 * de correlação são: external_id (id no People), empresa_cnpj, cargo_external_id,
 * colaborador_cpf — o SST resolve para seus próprios IDs.
 */

// O People é mestre de cargos e colaboradores (empurra via webhook). ASO/EPI
// NÃO entram aqui: o SST é o dono e o People consulta via API de leitura.
export const PEOPLE_EVENT_TYPES = [
  "cargo.upserted",
  "cargo.deleted",
  "colaborador.upserted",
  "colaborador.deleted",
] as const
export type PeopleEventType = (typeof PEOPLE_EVENT_TYPES)[number]

export const peopleCargoSchema = z.object({
  external_id: z.string().min(1),
  nome: z.string().min(1),
  cbo: z.string().optional().nullable(),
  empresa_cnpj: z.string().min(11),
  ativo: z.boolean().default(true),
})
export type PeopleCargo = z.infer<typeof peopleCargoSchema>

export const peopleColaboradorSchema = z.object({
  external_id: z.string().min(1),
  nome_completo: z.string().min(1),
  cpf: z.string().min(11),
  sexo: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().optional().nullable(),
  empresa_cnpj: z.string().min(11),
  cargo_external_id: z.string().optional().nullable(),
  obra_codigo: z.string().optional().nullable(),
  data_admissao: z.string().min(1), // obrigatório no SST (colaboradores.data_admissao)
  matricula: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
})
export type PeopleColaborador = z.infer<typeof peopleColaboradorSchema>

/** Para eventos *.deleted basta a chave externa. */
export const peopleDeleteSchema = z.object({ external_id: z.string().min(1) })

/** Envelope do evento (o `data` é validado por tipo no handler). */
export const peopleEventoSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.enum(PEOPLE_EVENT_TYPES),
  occurred_at: z.string().optional().nullable(),
  data: z.record(z.unknown()),
})
export type PeopleEvento = z.infer<typeof peopleEventoSchema>

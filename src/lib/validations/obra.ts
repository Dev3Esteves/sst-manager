import { z } from "zod"

export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const

/**
 * Obra/projeto em andamento. Referenciada em cabeçalhos de documentos
 * oficiais (OS NR-01, Ficha de EPI, APR, PT…) e para alocação de
 * colaboradores em campo.
 */
export const obraSchema = z.object({
  empresa_id: z.string().uuid("Empresa dona obrigatória"),
  contratante_id: z.string().uuid().optional().nullable(),
  nome: z.string().min(2, "Mínimo 2 caracteres"),
  codigo: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.enum(UFS).optional().nullable(),
  empreitada: z.enum(["total", "parcial"]).optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
  ativa: z.boolean().default(true),
})

export type ObraInput = z.infer<typeof obraSchema>

export const obraLocalSchema = z.object({
  obra_id: z.string().uuid(),
  nome: z.string().min(1, "Nome do local obrigatório"),
  tipo: z.enum(["interna", "externa", "outro"]).default("interna"),
  ativo: z.boolean().default(true),
})

export type ObraLocalInput = z.infer<typeof obraLocalSchema>

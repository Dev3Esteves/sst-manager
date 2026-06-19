import { z } from "zod"

const nstr = z.string().trim().min(1).optional().nullable().transform((v) => v ?? null)

// ── Local ────────────────────────────────────────────────────────────────────
export const TIPO_LOCAL_VALUES = ["central", "obra"] as const
export const localSchema = z
  .object({
    nome: z.string().trim().min(2, "Nome obrigatório"),
    tipo: z.enum(TIPO_LOCAL_VALUES),
    obra_id: z.string().uuid().optional().nullable(),
    ativo: z.boolean().default(true),
  })
  .refine((d) => (d.tipo === "obra") === !!d.obra_id, {
    message: "Local de obra exige uma obra; local central não tem obra.",
    path: ["obra_id"],
  })
export type LocalInput = z.infer<typeof localSchema>

// ── Compra ───────────────────────────────────────────────────────────────────
export const compraItemSchema = z.object({
  epi_id: z.string().uuid("EPI obrigatório"),
  lote: nstr,
  fabricacao: nstr,
  validade: nstr,
  quantidade: z.coerce.number().positive("Quantidade deve ser > 0"),
  custo_unitario: z.coerce.number().min(0, "Custo inválido"),
})
export const compraSchema = z.object({
  fornecedor_id: z.string().uuid("Fornecedor obrigatório"),
  local_id: z.string().uuid("Local de destino obrigatório"),
  nota_fiscal: nstr,
  data_compra: z.string().min(1, "Data obrigatória"),
  observacao: nstr,
  itens: z.array(compraItemSchema).min(1, "Inclua ao menos um item"),
})
export type CompraInput = z.infer<typeof compraSchema>
export type CompraItemInput = z.infer<typeof compraItemSchema>

// ── Transferência ─────────────────────────────────────────────────────────────
export const transferenciaSchema = z
  .object({
    epi_id: z.string().uuid("EPI obrigatório"),
    local_orig: z.string().uuid("Origem obrigatória"),
    local_dest: z.string().uuid("Destino obrigatório"),
    quantidade: z.coerce.number().positive("Quantidade deve ser > 0"),
    observacao: nstr,
  })
  .refine((d) => d.local_orig !== d.local_dest, {
    message: "Origem e destino devem ser diferentes",
    path: ["local_dest"],
  })
export type TransferenciaInput = z.infer<typeof transferenciaSchema>

// ── Ajuste de inventário ──────────────────────────────────────────────────────
export const ajusteSchema = z.object({
  epi_id: z.string().uuid("EPI obrigatório"),
  local_id: z.string().uuid("Local obrigatório"),
  quantidade_contada: z.coerce.number().min(0, "Quantidade inválida"),
  observacao: nstr,
})
export type AjusteInput = z.infer<typeof ajusteSchema>

// ── Entrada/saída manual ──────────────────────────────────────────────────────
export const entradaManualSchema = z.object({
  epi_id: z.string().uuid("EPI obrigatório"),
  local_id: z.string().uuid("Local obrigatório"),
  quantidade: z.coerce.number().positive("Quantidade deve ser > 0"),
  custo_unitario: z.coerce.number().min(0, "Custo inválido"),
  lote: nstr,
  fabricacao: nstr,
  validade: nstr,
  observacao: nstr,
})
export type EntradaManualInput = z.infer<typeof entradaManualSchema>

export const saidaManualSchema = z.object({
  epi_id: z.string().uuid("EPI obrigatório"),
  local_id: z.string().uuid("Local obrigatório"),
  quantidade: z.coerce.number().positive("Quantidade deve ser > 0"),
  observacao: nstr,
})
export type SaidaManualInput = z.infer<typeof saidaManualSchema>

// ── Parâmetros de controle ────────────────────────────────────────────────────
export const parametroSchema = z.object({
  epi_id: z.string().uuid("EPI obrigatório"),
  local_id: z.string().uuid().optional().nullable(),
  estoque_minimo: z.coerce.number().min(0).default(0),
  estoque_maximo: z.coerce.number().min(0).optional().nullable(),
  estoque_seguranca: z.coerce.number().min(0).default(0),
  lead_time_dias: z.coerce.number().int().min(0).default(0),
})
export type ParametroInput = z.infer<typeof parametroSchema>

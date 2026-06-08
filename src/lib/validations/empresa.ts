import { z } from "zod"
import { cnpjSchema } from "./shared"

/** Endereço da empresa (coluna `endereco` JSONB). Campos opcionais. */
export const enderecoEmpresaSchema = z
  .object({
    cep: z.string().optional().nullable(),
    logradouro: z.string().optional().nullable(),
    numero: z.string().optional().nullable(),
    complemento: z.string().optional().nullable(),
    bairro: z.string().optional().nullable(),
    municipio: z.string().optional().nullable(),
    uf: z.string().optional().nullable(),
  })
  .optional()
  .nullable()

/** Telefones da empresa (coluna `telefones` JSONB). */
export const telefonesEmpresaSchema = z
  .object({ principal: z.string().optional().nullable() })
  .optional()
  .nullable()

export const empresaSchema = z.object({
  razao_social: z.string().min(3, "Mínimo 3 caracteres"),
  nome_fantasia: z.string().optional().nullable(),
  cnpj: cnpjSchema,
  inscricao_estadual: z.string().optional().nullable(),
  endereco: enderecoEmpresaSchema,
  telefones: telefonesEmpresaSchema,
  tipo: z.enum(["propria", "contratante", "terceira"]),
  /**
   * Dona do sistema (multi-tenant). Se true, a empresa hospeda seus próprios
   * colaboradores/documentos/etc. e pode ter prestadoras/contratantes
   * vinculadas via `empresa_mae_id`. Implicado por `tipo = 'propria'`.
   */
  dona_sistema: z.boolean().default(false),
  /**
   * Quando esta empresa é prestadora ou contratante de uma empresa dona,
   * aponta para a dona responsável. Null quando ela própria é dona ou
   * quando o vínculo ainda não foi mapeado.
   */
  empresa_mae_id: z.string().uuid().optional().nullable(),
  ativo: z.boolean().default(true),
})

export type EmpresaInput = z.infer<typeof empresaSchema>

export const TIPO_EMPRESA_LABEL: Record<string, string> = {
  propria: "Dona do sistema",
  contratante: "Contratante",
  terceira: "Prestadora",
}

// ============================================================================
// Modelo Parceiro de Negócio (Business Partner) — papéis N + endereços/contatos
// 1:N + bloco fiscal. Usado pelo formulário/actions a partir da Fase 2.
// ============================================================================

export const PAPEL_VALUES = ["dona", "cliente", "prestadora", "fornecedor", "transportadora", "parceira"] as const
export const ENDERECO_TIPO_VALUES = ["sede", "filial", "cobranca", "obra", "entrega"] as const
export const CONTATO_TIPO_VALUES = ["telefone", "celular", "email", "pessoa"] as const
export const REGIME_TRIBUTARIO_VALUES = ["simples", "lucro_presumido", "lucro_real", "mei", "isento"] as const
export const SITUACAO_CADASTRAL_VALUES = ["ativa", "suspensa", "inapta", "baixada", "nula"] as const

export const PAPEL_LABEL: Record<(typeof PAPEL_VALUES)[number], string> = {
  dona: "Dona do sistema",
  cliente: "Cliente / Contratante",
  prestadora: "Prestadora",
  fornecedor: "Fornecedor",
  transportadora: "Transportadora",
  parceira: "Parceira",
}
export const ENDERECO_TIPO_LABEL: Record<(typeof ENDERECO_TIPO_VALUES)[number], string> = {
  sede: "Sede", filial: "Filial", cobranca: "Cobrança", obra: "Obra", entrega: "Entrega",
}
export const CONTATO_TIPO_LABEL: Record<(typeof CONTATO_TIPO_VALUES)[number], string> = {
  telefone: "Telefone", celular: "Celular", email: "E-mail", pessoa: "Pessoa de contato",
}
export const REGIME_TRIBUTARIO_LABEL: Record<(typeof REGIME_TRIBUTARIO_VALUES)[number], string> = {
  simples: "Simples Nacional", lucro_presumido: "Lucro Presumido", lucro_real: "Lucro Real",
  mei: "MEI", isento: "Isento",
}
export const SITUACAO_CADASTRAL_LABEL: Record<(typeof SITUACAO_CADASTRAL_VALUES)[number], string> = {
  ativa: "Ativa", suspensa: "Suspensa", inapta: "Inapta", baixada: "Baixada", nula: "Nula",
}

const nstr = z.string().trim().min(1).optional().nullable().transform((v) => v ?? null)

export const empresaEnderecoSchema = z.object({
  tipo: z.enum(ENDERECO_TIPO_VALUES).default("sede"),
  cep: nstr,
  logradouro: nstr,
  numero: nstr,
  complemento: nstr,
  bairro: nstr,
  municipio: nstr,
  uf: z.string().trim().max(2).optional().nullable().transform((v) => (v ? v.toUpperCase() : null)),
  principal: z.boolean().default(false),
})

export const empresaContatoSchema = z.object({
  tipo: z.enum(CONTATO_TIPO_VALUES),
  valor: nstr,
  nome_contato: nstr,
  cargo_contato: nstr,
  principal: z.boolean().default(false),
})

export const empresaFiscalSchema = z.object({
  inscricao_municipal: nstr,
  cnae_principal: z.string().trim().max(10).optional().nullable().transform((v) => v || null),
  regime_tributario: z.enum(REGIME_TRIBUTARIO_VALUES).optional().nullable(),
  situacao_cadastral: z.enum(SITUACAO_CADASTRAL_VALUES).optional().nullable(),
})

/** Payload do formulário de empresa (modelo BP). Enviado como JSON pela UI. */
export const empresaFormSchema = z
  .object({
    razao_social: z.string().trim().min(3, "Mínimo 3 caracteres"),
    nome_fantasia: nstr,
    cnpj: cnpjSchema,
    inscricao_estadual: nstr,
    dona_sistema: z.boolean().default(false),
    ativo: z.boolean().default(true),
    /** Vínculo de grupo (mantém empresa_mae_id por compatibilidade). */
    empresa_mae_id: z.string().uuid().optional().nullable(),
    papeis: z.array(z.enum(PAPEL_VALUES)).min(1, "Selecione ao menos um papel"),
    enderecos: z.array(empresaEnderecoSchema).default([]),
    contatos: z.array(empresaContatoSchema).default([]),
    fiscal: empresaFiscalSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // (Donas do sistema têm empresa_mae_id forçado a null no servidor/RPC.)
    const endPrincipais = data.enderecos.filter((e) => e.principal).length
    if (data.enderecos.length > 0 && endPrincipais > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["enderecos"], message: "Marque apenas um endereço como principal." })
    }
    const contPrincipais = data.contatos.filter((c) => c.principal).length
    if (contPrincipais > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contatos"], message: "Marque apenas um contato como principal." })
    }
  })

export type EmpresaFormInput = z.infer<typeof empresaFormSchema>
export type EmpresaEnderecoInput = z.infer<typeof empresaEnderecoSchema>
export type EmpresaContatoInput = z.infer<typeof empresaContatoSchema>
export type EmpresaFiscalInput = z.infer<typeof empresaFiscalSchema>

/** Deriva o `tipo` legado (dupla-escrita) a partir dos papéis/dona_sistema. */
export function derivarTipoLegado(papeis: string[], donaSistema: boolean): "propria" | "contratante" | "terceira" {
  if (donaSistema || papeis.includes("dona")) return "propria"
  if (papeis.includes("cliente")) return "contratante"
  return "terceira"
}

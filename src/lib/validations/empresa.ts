import { z } from "zod"
import { cnpjSchema } from "./shared"

export const empresaSchema = z.object({
  razao_social: z.string().min(3, "Mínimo 3 caracteres"),
  nome_fantasia: z.string().optional().nullable(),
  cnpj: cnpjSchema,
  inscricao_estadual: z.string().optional().nullable(),
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

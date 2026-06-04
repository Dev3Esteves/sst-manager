import { z } from "zod"

/**
 * Troca de senha do próprio usuário (tela /configuracoes → Minha conta).
 * Mínimo de 8 caracteres + confirmação batendo. O Supabase Auth aplica
 * suas próprias regras de complexidade; aqui garantimos o básico de UX.
 */
export const trocarSenhaSchema = z
  .object({
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmacao: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As senhas não conferem",
    path: ["confirmacao"],
  })

export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>

/**
 * Template padrão de certificado da empresa. Vazio é válido e significa
 * "voltar a usar o padrão do sistema" (a coluna fica null).
 */
export const templateCertificadoSchema = z.object({
  template_certificado: z
    .string()
    .max(5000, "Template muito longo (máx. 5000 caracteres)")
    .optional()
    .nullable(),
})

export type TemplateCertificadoInput = z.infer<typeof templateCertificadoSchema>

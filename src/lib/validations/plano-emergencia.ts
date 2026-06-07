import { z } from "zod"

export const CENARIOS_EMERGENCIA: Record<string, string> = {
  incendio: "Incêndio",
  vazamento: "Vazamento / produto químico",
  desabamento: "Desabamento / soterramento",
  choque_eletrico: "Choque elétrico",
  primeiros_socorros: "Primeiros socorros / acidente",
  evacuacao: "Evacuação",
  climatica: "Emergência climática",
  outro: "Outro",
}

export const planoEmergenciaSchema = z.object({
  titulo: z.string().min(3, "Título obrigatório"),
  cenario: z.enum(["incendio", "vazamento", "desabamento", "choque_eletrico", "primeiros_socorros", "evacuacao", "climatica", "outro"]),
  obra_id: z.string().uuid().optional().nullable(),
  descricao: z.string().optional().nullable(),
  procedimento_resposta: z.string().optional().nullable(),
  recursos: z.string().optional().nullable(),
  brigada_responsavel: z.string().optional().nullable(),
  contatos_emergencia: z.string().optional().nullable(),
  ultimo_simulado: z.string().optional().nullable(),
  proximo_simulado: z.string().optional().nullable(),
  licoes_aprendidas: z.string().optional().nullable(),
  data_revisao: z.string().optional().nullable(),
  status: z.enum(["ativo", "em_revisao", "inativo"]).default("ativo"),
})

export type PlanoEmergenciaInput = z.infer<typeof planoEmergenciaSchema>

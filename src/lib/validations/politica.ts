import { z } from "zod"

export const politicaSchema = z.object({
  titulo: z.string().min(3, "Título obrigatório"),
  conteudo: z.string().min(20, "Descreva a política (mín. 20 caracteres)"),
  compromisso_condicoes_seguras: z.boolean().default(true),
  compromisso_requisitos_legais: z.boolean().default(true),
  compromisso_eliminar_riscos: z.boolean().default(true),
  compromisso_melhoria_continua: z.boolean().default(true),
  compromisso_participacao: z.boolean().default(true),
  aprovado_por_nome: z.string().optional().nullable(),
  aprovado_por_cargo: z.string().optional().nullable(),
  data_aprovacao: z.string().optional().nullable(),
  publica: z.boolean().default(false),
})

export type PoliticaInput = z.infer<typeof politicaSchema>

/** Compromissos exigidos pela cláusula 5.2 da ISO 45001:2018. */
export const COMPROMISSOS_52: { campo: keyof PoliticaInput; label: string }[] = [
  { campo: "compromisso_condicoes_seguras", label: "Prover condições de trabalho seguras e saudáveis (prevenção de lesões e doenças)" },
  { campo: "compromisso_requisitos_legais", label: "Cumprir requisitos legais (NRs) e outros requisitos aplicáveis" },
  { campo: "compromisso_eliminar_riscos", label: "Eliminar perigos e reduzir riscos de SST" },
  { campo: "compromisso_melhoria_continua", label: "Melhorar continuamente o SGSST e o desempenho de SST" },
  { campo: "compromisso_participacao", label: "Consulta e participação dos trabalhadores" },
]

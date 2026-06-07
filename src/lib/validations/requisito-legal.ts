import { z } from "zod"

export const REQ_TIPOS: Record<string, string> = {
  nr: "Norma Regulamentadora",
  lei: "Lei",
  decreto: "Decreto",
  portaria: "Portaria",
  norma_tecnica: "Norma técnica (ABNT)",
  convencao: "Convenção/Acordo",
  outro: "Outro",
}

export const requisitoLegalSchema = z.object({
  tipo: z.enum(["nr", "lei", "decreto", "portaria", "norma_tecnica", "convencao", "outro"]).default("nr"),
  referencia: z.string().min(1, "Informe a referência"),
  titulo: z.string().optional().nullable(),
  aplicabilidade: z.string().optional().nullable(),
  atende: z.enum(["sim", "nao", "na"]).optional().nullable(),
  evidencia: z.string().optional().nullable(),
  responsavel_nome: z.string().optional().nullable(),
  data_avaliacao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
})

export type RequisitoLegalInput = z.infer<typeof requisitoLegalSchema>

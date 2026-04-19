import { z } from "zod"

export const ddsParticipanteSchema = z.object({
  colaborador_id: z.string().uuid().optional().nullable(),
  nome: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().optional().nullable(),
  cargo: z.string().optional().nullable(),
  assinatura_data_url: z.string().optional().nullable(),
})

export const ddsSchema = z.object({
  empresa_id: z.string().uuid("Empresa obrigatória"),
  tema: z.string().min(3, "Informe o tema"),
  data_dds: z.string().min(1, "Data obrigatória"),
  hora_inicio: z.string().optional().nullable(),
  duracao_minutos: z.coerce.number().int().min(1).max(240).default(15),
  local: z.string().min(1, "Local obrigatório"),
  mediador_nome: z.string().min(2, "Nome do mediador obrigatório"),
  mediador_cargo: z.string().optional().nullable(),
  topicos: z.array(z.string()).default([]),
  observacoes: z.string().optional().nullable(),
  participantes: z.array(ddsParticipanteSchema).min(1, "Inclua ao menos 1 participante"),
  assinatura_mediador_data_url: z.string().optional().nullable(),
})

export type DdsInput = z.infer<typeof ddsSchema>
export type DdsParticipante = z.infer<typeof ddsParticipanteSchema>

export const TEMAS_SUGERIDOS = [
  "NR-10 — Riscos em trabalho com eletricidade",
  "NR-35 — Trabalho em altura: pontos de ancoragem",
  "NR-33 — Atmosferas em espaço confinado",
  "Uso correto de EPIs",
  "Sinalização e isolamento de área",
  "Ferramentas manuais e elétricas",
  "Análise de APR antes da tarefa",
  "Relato de quase-acidentes",
  "Comunicação de riscos",
  "Prevenção de choque elétrico",
  "Trabalho em data centers — riscos específicos",
  "Ergonomia e posturas",
  "Primeiros socorros básicos",
  "Ordem e limpeza no canteiro",
  "Condições climáticas e paralisações",
] as const

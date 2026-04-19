import { z } from "zod"

export const PT_TIPOS = ["altura", "confinado", "quente", "eletrico"] as const
export type PtTipo = (typeof PT_TIPOS)[number]

export const PT_TIPO_LABEL: Record<PtTipo, string> = {
  altura: "Trabalho em altura (NR-35)",
  confinado: "Espaço confinado (NR-33)",
  quente: "Trabalho a quente (NR-18/23)",
  eletrico: "Serviço elétrico (NR-10)",
}

// Checklist padrão por tipo — as chaves são renderizadas dinamicamente no form
export const PT_CHECKLIST: Record<PtTipo, { id: string; label: string }[]> = {
  altura: [
    { id: "cinto_paraquedista", label: "Cinto tipo paraquedista inspecionado e dentro da validade" },
    { id: "talabarte_duplo", label: "Talabarte duplo com absorvedor de energia" },
    { id: "ponto_ancoragem", label: "Ponto de ancoragem ≥ 15 kN identificado e testado" },
    { id: "distancia_queda", label: "Distância mínima livre de queda calculada e adequada" },
    { id: "aptidao_fisica", label: "Trabalhador com aptidão médica e treinamento NR-35 vigentes" },
    { id: "area_isolada", label: "Área isolada e sinalizada na projeção da queda" },
    { id: "condicoes_climaticas", label: "Condições climáticas favoráveis (vento, chuva, raios)" },
  ],
  confinado: [
    { id: "atmosfera_medida", label: "Atmosfera medida antes da entrada (O₂ 19,5-23%, LEL <10%)" },
    { id: "ventilacao_forcada", label: "Ventilação forçada contínua" },
    { id: "vigia_externo", label: "Vigia externo designado e equipado com rádio" },
    { id: "resgate", label: "Equipamento de resgate no local e testado" },
    { id: "comunicacao", label: "Sistema de comunicação com entrada/saída" },
    { id: "bloqueio_fontes", label: "Bloqueio/etiquetagem (LOTO) de fontes de energia" },
    { id: "iluminacao", label: "Iluminação com luminárias intrinsecamente seguras" },
  ],
  quente: [
    { id: "area_limpa", label: "Área limpa de materiais combustíveis em raio de 10 m" },
    { id: "extintor", label: "Extintor de incêndio apropriado no local" },
    { id: "vigia_fogo", label: "Vigia do fogo presente durante e 30 min após a tarefa" },
    { id: "cobertor_termico", label: "Cobertor térmico / proteção das superfícies adjacentes" },
    { id: "ventilacao", label: "Ventilação e exaustão dos gases gerados" },
    { id: "sprinklers_gases", label: "Sprinklers/gases de combate não afetados" },
    { id: "epi_soldagem", label: "EPI para soldagem/corte (máscara, avental, luva)" },
  ],
  eletrico: [
    { id: "desenergizacao", label: "Desenergização executada conforme procedimento" },
    { id: "impedimento_reenergizacao", label: "Impedimento de reenergização (LOTO)" },
    { id: "teste_ausencia_tensao", label: "Teste de ausência de tensão realizado" },
    { id: "aterramento_temporario", label: "Aterramento temporário instalado" },
    { id: "sinalizacao_zona", label: "Sinalização e delimitação da zona controlada" },
    { id: "epi_epc", label: "EPIs e EPCs específicos para a tensão (classe adequada)" },
    { id: "equipe_autorizada", label: "Equipe com qualificação, habilitação e autorização NR-10 vigentes" },
  ],
}

export const respostaPtSchema = z.object({
  item_id: z.string(),
  label: z.string(),
  conforme: z.boolean(),
  observacao: z.string().optional().nullable(),
})

export const ptSchema = z.object({
  tipo: z.enum(PT_TIPOS),
  empresa_id: z.string().uuid(),
  local_trabalho: z.string().min(3, "Local obrigatório"),
  descricao_tarefa: z.string().min(5, "Descreva a tarefa"),
  data_emissao: z.string().min(1),
  hora_inicio: z.string().min(1),
  hora_fim: z.string().min(1),
  solicitante: z.string().min(2),
  executante: z.string().min(2),
  aprovador: z.string().min(2),
  checklist: z.array(respostaPtSchema),
  medidas_especificas: z.string().optional().nullable(),
})

export type PtInput = z.infer<typeof ptSchema>
export type PtRespostaItem = z.infer<typeof respostaPtSchema>

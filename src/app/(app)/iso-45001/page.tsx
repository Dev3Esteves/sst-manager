import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, UserCog } from "lucide-react"

export const metadata = { title: "Aderência ISO 45001" }

type Status = "atende" | "parcial" | "manual" | "gap"

type Item = { requisito: string; como: string; status: Status }
type Clausula = { numero: string; titulo: string; itens: Item[] }

const STATUS: Record<Status, { label: string; variant: BadgeProps["variant"]; icon: React.ReactNode }> = {
  atende: { label: "Atende", variant: "regular", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  parcial: { label: "Parcial", variant: "alerta", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  manual: { label: "Processo (fora do sistema)", variant: "secondary", icon: <UserCog className="h-3.5 w-3.5" /> },
  gap: { label: "Gap", variant: "vencido", icon: <XCircle className="h-3.5 w-3.5" /> },
}

// Mapeamento dos requisitos ISO 45001:2018 (cláusulas 4–10) às funcionalidades do SST.
const CLAUSULAS: Clausula[] = [
  {
    numero: "4", titulo: "Contexto da organização",
    itens: [
      { requisito: "4.1/4.2 Questões internas/externas e partes interessadas", como: "Definido no escopo do SGSST (processo); empresas e contratantes cadastrados.", status: "manual" },
      { requisito: "4.3/4.4 Escopo e sistema de gestão de SST", como: "Estrutura multiempresa por obra; PGR por obra delimita o escopo operacional.", status: "parcial" },
    ],
  },
  {
    numero: "5", titulo: "Liderança e participação dos trabalhadores",
    itens: [
      { requisito: "5.1 Liderança e comprometimento", como: "Painel GRO e indicadores para a diretoria (perfil gestor_diretoria).", status: "parcial" },
      { requisito: "5.2 Política de SST", como: "Módulo Política de SST (/politica): documento versionado com os compromissos da 5.2, aprovação da direção, publicação e registro de ciência dos trabalhadores.", status: "atende" },
      { requisito: "5.4 Consulta e participação", como: "DDS (diálogos), participantes e assinaturas registrados.", status: "parcial" },
    ],
  },
  {
    numero: "6", titulo: "Planejamento",
    itens: [
      { requisito: "6.1.1 Ações para riscos e oportunidades", como: "PGR: inventário de riscos por GHE + plano de ação 5W1H.", status: "atende" },
      { requisito: "6.1.2 Identificação de perigos e avaliação de riscos", como: "PGR (pgr_risco) com categoria e classificação; NR-01 psicossocial integrado.", status: "atende" },
      { requisito: "6.1.3 Requisitos legais e outros", como: "Catálogo de NRs e Tabela 22 eSocial (Referências).", status: "parcial" },
      { requisito: "6.2 Objetivos de SST e planejamento", como: "Plano de ação do PGR + indicadores (TF/TG, conformidade).", status: "parcial" },
    ],
  },
  {
    numero: "7", titulo: "Apoio",
    itens: [
      { requisito: "7.1/7.2 Recursos e competência", como: "Treinamentos: catálogo, matriz por cargo, realizações e gap analysis.", status: "atende" },
      { requisito: "7.3 Conscientização", como: "DDS + treinamentos de integração registrados.", status: "atende" },
      { requisito: "7.4 Comunicação", como: "Parcial: ocorrências/NCs; comunicação formal externa é processo.", status: "parcial" },
      { requisito: "7.5 Informação documentada", como: "Documentos SST, PGR (PDF + hash), manuais; versionamento de docs.", status: "atende" },
    ],
  },
  {
    numero: "8", titulo: "Operação",
    itens: [
      { requisito: "8.1.1 Controles operacionais (hierarquia)", como: "PGR: medidas de controle por nível NIOSH (1–5); matriz EPI×GHE e EPI×Cargo.", status: "atende" },
      { requisito: "8.1.2 Eliminação de perigos e redução de riscos", como: "Hierarquia NIOSH no PGR; inspeções de campo (checklists).", status: "atende" },
      { requisito: "8.1.3 Gestão de mudança / 8.1.4 Aquisição", como: "Não há módulo dedicado de gestão de mudança.", status: "gap" },
      { requisito: "8.2 Preparação e resposta a emergências", como: "Ocorrências tipo 'emergência' + template; plano de emergência é processo.", status: "parcial" },
    ],
  },
  {
    numero: "9", titulo: "Avaliação de desempenho",
    itens: [
      { requisito: "9.1 Monitoramento, medição e avaliação", como: "Indicadores (TF/TG), inspeções com % conformidade, vencimentos, Painel GRO.", status: "atende" },
      { requisito: "9.1 Avaliação do atendimento legal", como: "Vencimentos de exames/treinamentos/CAs + matriz de treinamentos por NR.", status: "atende" },
      { requisito: "9.2 Auditoria interna", como: "Inspeções servem de base; programa formal de auditoria é processo.", status: "parcial" },
      { requisito: "9.3 Análise crítica pela direção", como: "Relatório mensal + Painel GRO alimentam a análise crítica.", status: "parcial" },
    ],
  },
  {
    numero: "10", titulo: "Melhoria",
    itens: [
      { requisito: "10.1 Generalidades", como: "Painel GRO consolida oportunidades de melhoria.", status: "parcial" },
      { requisito: "10.2 Incidente, não-conformidade e ação corretiva", como: "Módulo de NCs: 5 Porquês/Ishikawa + ações corretivas com verificação de eficácia.", status: "atende" },
      { requisito: "10.3 Melhoria contínua", como: "Ciclo PDCA do GRO sobre o PGR + tratamento de recorrências.", status: "parcial" },
    ],
  },
]

export default function Iso45001Page() {
  const todos = CLAUSULAS.flatMap((c) => c.itens)
  const cont = (s: Status) => todos.filter((i) => i.status === s).length
  const gaps = CLAUSULAS.flatMap((c) => c.itens.filter((i) => i.status === "gap").map((i) => ({ c: c.numero, ...i })))

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-7 w-7" /> Aderência ISO 45001:2018
        </h1>
        <p className="text-muted-foreground">
          Mapeamento dos requisitos (cláusulas 4–10) às funcionalidades do SST Manager, com lacunas.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <ResumoBadge label="Atende" valor={cont("atende")} variant="regular" />
        <ResumoBadge label="Parcial" valor={cont("parcial")} variant="alerta" />
        <ResumoBadge label="Processo" valor={cont("manual")} variant="secondary" />
        <ResumoBadge label="Gaps" valor={cont("gap")} variant="vencido" />
      </div>

      {CLAUSULAS.map((c) => (
        <Card key={c.numero}>
          <CardHeader>
            <CardTitle className="text-lg">Cláusula {c.numero} — {c.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {c.itens.map((i, idx) => {
              const s = STATUS[i.status]
              return (
                <div key={idx} className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i.requisito}</p>
                    <p className="text-xs text-muted-foreground">{i.como}</p>
                  </div>
                  <Badge variant={s.variant} className="gap-1 shrink-0 self-start">{s.icon}{s.label}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {gaps.length > 0 && (
        <Card className="border-status-vencido">
          <CardHeader>
            <CardTitle className="text-base text-status-vencido">Relatório de gaps ({gaps.length})</CardTitle>
            <CardDescription>Requisitos sem cobertura no sistema — tratar por processo ou evolução futura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {gaps.map((g, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">Cláusula {g.c}:</span> {g.requisito}
                <span className="text-muted-foreground"> — {g.como}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ResumoBadge({ label, valor, variant }: { label: string; valor: number; variant: BadgeProps["variant"] }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardDescription>{label}</CardDescription></CardHeader>
      <CardContent><div className="flex items-center gap-2"><Badge variant={variant}>{valor}</Badge></div></CardContent>
    </Card>
  )
}

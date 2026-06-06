import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Hammer, SearchCheck, RefreshCw, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0
}

/**
 * Painel GRO — camada de gestão (PDCA) sobre o PGR já existente.
 * Não recria o PGR; orquestra indicadores do que já está cadastrado:
 *  Planejar (inventário/medidas) · Fazer (plano de ação) ·
 *  Verificar (inspeções/NCs/vencimentos) · Agir (ações corretivas/recorrência).
 */
export default async function GroPage() {
  const supabase = await createClient()
  const inicioAno = `${new Date().getFullYear()}-01-01`

  const [
    { data: pgrs },
    { data: riscos },
    { data: acoes },
    { data: medidas },
    { data: inspecoes },
    { data: ncs },
    { data: acoesCorretivas },
    { data: ocorrencias },
    { count: vencCriticos },
  ] = await Promise.all([
    supabase.from("pgr").select("status, data_vencimento"),
    supabase.from("pgr_risco").select("categoria_risco"),
    supabase.from("pgr_acao").select("status"),
    supabase.from("pgr_medida_controle").select("status, nivel_niosh"),
    supabase.from("inspecoes").select("percentual_conformidade, data_inspecao").gte("data_inspecao", inicioAno),
    supabase.from("nao_conformidades").select("status, severidade"),
    supabase.from("nc_acoes_corretivas").select("status, eficaz, data_prazo"),
    supabase.from("ocorrencias").select("status, tipo").gte("data_ocorrencia", inicioAno),
    supabase.from("vw_vencimentos").select("*", { count: "exact", head: true }).in("urgencia", ["critico", "vencido"]),
  ])

  // PLANEJAR
  const pgrVigentes = (pgrs ?? []).filter((p) => p.status === "vigente").length
  const riscosCriticos = (riscos ?? []).filter((r) => ["alto", "muito_alto"].includes(r.categoria_risco)).length
  const totalRiscos = riscos?.length ?? 0

  // FAZER
  const acoesTotal = acoes?.length ?? 0
  const acoesConcluidas = (acoes ?? []).filter((a) => a.status === "concluido").length
  const acoesAndamento = (acoes ?? []).filter((a) => ["em_andamento", "planejado", "pendente"].includes(a.status)).length
  const medidasImplantadas = (medidas ?? []).filter((m) => m.status === "implantado").length
  const medidasTotal = medidas?.length ?? 0

  // VERIFICAR
  const inspecoesAno = inspecoes?.length ?? 0
  const confMedia = inspecoesAno > 0
    ? Math.round(((inspecoes ?? []).reduce((acc, i) => acc + (Number(i.percentual_conformidade) || 0), 0) / inspecoesAno) * 10) / 10
    : null
  const ncsAbertas = (ncs ?? []).filter((n) => !["encerrada", "cancelada"].includes(n.status)).length
  const ncsCriticas = (ncs ?? []).filter((n) => n.severidade === "critica" && !["encerrada", "cancelada"].includes(n.status)).length

  // AGIR
  const acTotal = acoesCorretivas?.length ?? 0
  const acConcluidas = (acoesCorretivas ?? []).filter((a) => a.status === "concluida").length
  const acEficazes = (acoesCorretivas ?? []).filter((a) => a.eficaz === true).length
  const hoje = new Date().toISOString().slice(0, 10)
  const acAtrasadas = (acoesCorretivas ?? []).filter((a) => a.status !== "concluida" && a.status !== "cancelada" && a.data_prazo && a.data_prazo < hoje).length
  const ocorrenciasAno = ocorrencias?.length ?? 0

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel GRO</h1>
        <p className="text-muted-foreground">
          Gerenciamento de Riscos Ocupacionais — visão PDCA sobre o PGR (NR-01). Orquestra o que já está cadastrado.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PdcaCard
          fase="Planejar" icon={<ClipboardList className="h-5 w-5" />} tone="regular"
          href="/pgr" linkLabel="Ver PGRs"
          metrics={[
            { label: "PGRs vigentes", value: pgrVigentes },
            { label: "Riscos no inventário", value: totalRiscos },
            { label: "Riscos alto/muito alto", value: riscosCriticos, alerta: riscosCriticos > 0 },
          ]}
        />
        <PdcaCard
          fase="Fazer" icon={<Hammer className="h-5 w-5" />} tone="alerta"
          href="/pgr" linkLabel="Plano de ação"
          metrics={[
            { label: "Ações concluídas", value: `${acoesConcluidas}/${acoesTotal}`, sub: `${pct(acoesConcluidas, acoesTotal)}%` },
            { label: "Ações em aberto", value: acoesAndamento },
            { label: "Medidas implantadas", value: `${medidasImplantadas}/${medidasTotal}` },
          ]}
        />
        <PdcaCard
          fase="Verificar" icon={<SearchCheck className="h-5 w-5" />} tone="critico"
          href="/nao-conformidades" linkLabel="Não-conformidades"
          metrics={[
            { label: "Conformidade média (ano)", value: confMedia != null ? `${confMedia}%` : "—" },
            { label: "NCs abertas", value: ncsAbertas, alerta: ncsAbertas > 0 },
            { label: "Vencimentos críticos", value: vencCriticos ?? 0, alerta: (vencCriticos ?? 0) > 0 },
          ]}
        />
        <PdcaCard
          fase="Agir" icon={<RefreshCw className="h-5 w-5" />} tone="vencido"
          href="/nao-conformidades" linkLabel="Ações corretivas"
          metrics={[
            { label: "Ações corretivas concluídas", value: `${acConcluidas}/${acTotal}` },
            { label: "Verificadas como eficazes", value: acEficazes },
            { label: "Ações corretivas atrasadas", value: acAtrasadas, alerta: acAtrasadas > 0 },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ResumoCard titulo="Inspeções no ano" valor={inspecoesAno} href="/inspecoes" />
        <ResumoCard titulo="Ocorrências no ano" valor={ocorrenciasAno} href="/ocorrencias" />
        <ResumoCard titulo="NCs críticas em aberto" valor={ncsCriticas} href="/nao-conformidades" tone={ncsCriticas > 0 ? "vencido" : "regular"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como ler este painel</CardTitle>
          <CardDescription>O GRO é o processo; o PGR é o documento que o materializa.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p><strong>Planejar</strong> — identificar perigos e avaliar riscos (inventário de riscos e GHE no PGR).</p>
          <p><strong>Fazer</strong> — implementar as medidas de controle (plano de ação 5W1H e hierarquia NIOSH).</p>
          <p><strong>Verificar</strong> — monitorar (inspeções, indicadores, vencimentos de exames/treinamentos/CAs e NCs).</p>
          <p><strong>Agir</strong> — corrigir e melhorar (ações corretivas com verificação de eficácia; tratar recorrências).</p>
        </CardContent>
      </Card>
    </div>
  )
}

type Metric = { label: string; value: string | number; sub?: string; alerta?: boolean }

function PdcaCard({
  fase, icon, tone, metrics, href, linkLabel,
}: {
  fase: string
  icon: React.ReactNode
  tone: "regular" | "alerta" | "critico" | "vencido"
  metrics: Metric[]
  href: string
  linkLabel: string
}) {
  const toneClass = {
    regular: "text-status-regular", alerta: "text-status-alerta",
    critico: "text-status-critico", vencido: "text-status-vencido",
  }[tone]
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base flex items-center gap-2 ${toneClass}`}>{icon}{fase}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className="text-sm font-semibold">
              {m.alerta ? <Badge variant="vencido">{m.value}</Badge> : <>{m.value}{m.sub ? <span className="text-xs text-muted-foreground ml-1">({m.sub})</span> : null}</>}
            </span>
          </div>
        ))}
        <Link href={href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1">
          {linkLabel} <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

function ResumoCard({ titulo, valor, href, tone = "regular" }: { titulo: string; valor: number; href: string; tone?: "regular" | "vencido" }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary">
        <CardHeader className="pb-2"><CardDescription>{titulo}</CardDescription></CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${tone === "vencido" ? "text-status-vencido" : ""}`}>{valor}</div>
        </CardContent>
      </Card>
    </Link>
  )
}

import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, AlertTriangle, ClipboardCheck, HeartPulse, Clock, TrendingUp, Calendar } from "lucide-react"

// Horas-homem-trabalhadas estimadas (configurável via env ou tabela futura)
// ~300 colaboradores × 220h/mês × 12 meses = 792.000 HHT/ano; aqui usamos ano corrente.
const HHT_ANUAL_ESTIMADO = 792_000

export default async function DashboardPage() {
  const supabase = await createClient()
  const anoAtual = new Date().getFullYear()
  const inicioAno = `${anoAtual}-01-01`

  const [colab, docs, ocorrAnoAll, insp, exames, vencCrit, ocorrComAfast, ultimoAcidente] = await Promise.all([
    supabase.from("colaboradores").select("*", { count: "exact", head: true }),
    supabase.from("documentos_sst").select("*", { count: "exact", head: true }),
    supabase.from("ocorrencias").select("dias_afastamento, tipo", { count: "exact" }).gte("data_ocorrencia", inicioAno),
    supabase.from("inspecoes").select("*", { count: "exact", head: true }),
    supabase.from("exames_medicos").select("*", { count: "exact", head: true }),
    supabase.from("vw_vencimentos").select("*", { count: "exact", head: true }).in("urgencia", ["critico", "vencido"]),
    // acidentes com afastamento no ano (para TF)
    supabase.from("ocorrencias").select("dias_afastamento", { count: "exact", head: true })
      .in("tipo", ["acidente_tipico", "acidente_trajeto"]).gte("data_ocorrencia", inicioAno).gt("dias_afastamento", 0),
    // último acidente com afastamento (dias sem acidentes)
    supabase.from("ocorrencias").select("data_ocorrencia")
      .in("tipo", ["acidente_tipico", "acidente_trajeto"]).gt("dias_afastamento", 0)
      .order("data_ocorrencia", { ascending: false }).limit(1).maybeSingle(),
  ])

  const diasAfastamentoAno = (ocorrAnoAll.data ?? []).reduce((acc, o) => acc + (o.dias_afastamento ?? 0), 0)
  const nAcidentesComAfast = ocorrComAfast.count ?? 0

  // TF = (nº acidentes × 1.000.000) / HHT
  const tf = HHT_ANUAL_ESTIMADO > 0 ? ((nAcidentesComAfast * 1_000_000) / HHT_ANUAL_ESTIMADO) : 0
  // TG = (dias perdidos × 1.000.000) / HHT
  const tg = HHT_ANUAL_ESTIMADO > 0 ? ((diasAfastamentoAno * 1_000_000) / HHT_ANUAL_ESTIMADO) : 0

  // Dias sem acidentes — desde o último acidente com afastamento, ou desde início do ano se não houve
  const diasSemAcidentes = (() => {
    const base = ultimoAcidente.data?.data_ocorrencia ?? `${anoAtual}-01-01`
    const d = Math.floor((Date.now() - new Date(base).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, d)
  })()

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de SST.</p>
      </div>

      {/* KPIs de segurança — indicadores CLT/NR */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-status-regular">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dias sem acidentes</CardTitle>
            <Calendar className="h-4 w-4 text-status-regular" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-regular">{diasSemAcidentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Desde o último acidente com afastamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Frequência (TF)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tf.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {nAcidentesComAfast} acidente(s) × 10⁶ / {HHT_ANUAL_ESTIMADO.toLocaleString("pt-BR")} HHT
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Gravidade (TG)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tg.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {diasAfastamentoAno} dia(s) perdido(s) em {anoAtual}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs operacionais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={<Users />} label="Colaboradores" value={colab.count ?? 0} href="/colaboradores" />
        <KpiCard icon={<HeartPulse />} label="Exames" value={exames.count ?? 0} href="/exames" />
        <KpiCard icon={<FileText />} label="Documentos" value={docs.count ?? 0} href="/documentos" />
        <KpiCard icon={<ClipboardCheck />} label="Inspeções" value={insp.count ?? 0} href="/inspecoes" />
        <KpiCard icon={<AlertTriangle />} label="Ocorrências (ano)" value={ocorrAnoAll.count ?? 0} href="/ocorrencias" />
        <KpiCard icon={<Clock />} label="Vencim. críticos" value={vencCrit.count ?? 0} href="/vencimentos" tone="critico" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Legenda — Status de vencimento</CardTitle>
          <CardDescription>Paleta SST usada em todo o sistema.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="regular">Em dia</Badge>
          <Badge variant="alerta">Alerta (≤60 dias)</Badge>
          <Badge variant="critico">Crítico (≤30 dias)</Badge>
          <Badge variant="vencido">Vencido</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  icon, label, value, href, tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  href?: string
  tone?: "critico"
}) {
  const highlight = tone === "critico" && value > 0
  const inner = (
    <Card className={highlight ? "border-status-critico" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className={highlight ? "text-status-critico" : "text-muted-foreground"}>
          <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

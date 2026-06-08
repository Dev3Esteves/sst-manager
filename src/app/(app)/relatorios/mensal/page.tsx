import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listarMeses, parseMesRef, mesAnterior, variacaoPct } from "@/lib/utils/relatorio-mensal"
import { calcularHHT, calcularTF, calcularTG, diasParaHoras } from "@/lib/indicadores/sst"
import { OCORRENCIA_TIPOS, GRAVIDADE_LABEL } from "@/lib/validations/ocorrencia"
import { formatDate, urgenciaBadgeVariant, urgenciaLabel, type Urgencia } from "@/lib/utils/vencimento"
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar,
  Users, HeartPulse, GraduationCap, ClipboardCheck, FileText, MessageSquare,
} from "lucide-react"
import { PrintButton } from "./print-button"
import { brand } from "@/config/brand"
import { SubmitOnChangeSelect } from "@/components/ui/submit-on-change-select"

export default async function RelatorioMensalPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const ref = parseMesRef(params.mes)
  const anterior = mesAnterior(ref)
  const meses = listarMeses(12)

  const supabase = await createClient()

  // Empresas (para pegar logo e razão social da própria)
  const { data: empresas } = await supabase
    .from("empresas").select("razao_social, cnpj, logo_url").eq("tipo", "propria").limit(1)
  const empresaPropria = empresas?.[0]

  // ============ Consultas do mês atual ============
  const [
    ocorrenciasMes, ocorrenciasAnterior,
    docsMes, ddsMes, inspecoesMes, examesMes, treinamentosMes,
    ultimoAcidente, colabAtivos, examesVigentes, treinamentosVigentes,
    vencCriticos,
  ] = await Promise.all([
    supabase.from("ocorrencias")
      .select("id, tipo, data_ocorrencia, local, gravidade, dias_afastamento, colaboradores(nome_completo)")
      .gte("data_ocorrencia", ref.inicio).lt("data_ocorrencia", ref.fim)
      .order("data_ocorrencia"),
    supabase.from("ocorrencias")
      .select("tipo, dias_afastamento", { count: "exact" })
      .gte("data_ocorrencia", anterior.inicio).lt("data_ocorrencia", anterior.fim),
    supabase.from("documentos_sst")
      .select("tipo", { count: "exact" })
      .gte("data_emissao", ref.inicio).lt("data_emissao", ref.fim),
    supabase.from("documentos_sst")
      .select("conteudo")
      .eq("tipo", "dialogo_seguranca")
      .gte("data_emissao", ref.inicio).lt("data_emissao", ref.fim),
    supabase.from("inspecoes")
      .select("percentual_conformidade, respostas")
      .gte("data_inspecao", ref.inicio).lt("data_inspecao", ref.fim),
    supabase.from("exames_medicos")
      .select("tipo", { count: "exact" })
      .gte("data_realizacao", ref.inicio).lt("data_realizacao", ref.fim),
    supabase.from("treinamentos_realizados")
      .select("id", { count: "exact", head: true })
      .gte("data_realizacao", ref.inicio).lt("data_realizacao", ref.fim),
    supabase.from("ocorrencias")
      .select("data_ocorrencia")
      .in("tipo", ["acidente_tipico", "acidente_trajeto"]).gt("dias_afastamento", 0)
      .order("data_ocorrencia", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("exames_medicos").select("*", { count: "exact", head: true }).eq("status", "vigente"),
    supabase.from("treinamentos_realizados").select("*", { count: "exact", head: true }).eq("status", "vigente"),
    supabase.from("vw_vencimentos").select("*").in("urgencia", ["critico", "vencido"]).order("dias_restantes", { ascending: true }).limit(20),
  ])

  const ocorrencias = ocorrenciasMes.data ?? []
  const ocorrAnteriorTotal = ocorrenciasAnterior.count ?? 0

  const acidentesMes = ocorrencias.filter(o => ["acidente_tipico", "acidente_trajeto"].includes(o.tipo))
  const acidentesComAfastMes = acidentesMes.filter(o => (o.dias_afastamento ?? 0) > 0).length
  const diasPerdidosMes = ocorrencias.reduce((acc, o) => acc + (o.dias_afastamento ?? 0), 0)

  // HHT estimado: colaboradores ativos × jornada mensal padrão − horas afastadas.
  // Sem integração com folha; dias_debitados (NBR 14280) ainda não catalogados.
  const hhtMes = calcularHHT({
    colaboradoresAtivos: colabAtivos.count ?? 0,
    horasAfastadas: diasParaHoras(diasPerdidosMes),
  })
  const tfMes = calcularTF(acidentesComAfastMes, hhtMes)
  const tgMes = calcularTG(diasPerdidosMes, 0, hhtMes)

  // Dias sem acidentes
  const diasSemAcidentes = (() => {
    const base = ultimoAcidente.data?.data_ocorrencia ?? `${ref.ano}-01-01`
    const d = Math.floor((Date.now() - new Date(base).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, d)
  })()

  // Compliance
  const nColab = colabAtivos.count ?? 0
  const pctExames = nColab > 0 ? Math.round(((examesVigentes.count ?? 0) / nColab) * 100) : 0
  const pctTreinamentos = nColab > 0 ? Math.round(((treinamentosVigentes.count ?? 0) / nColab) * 100) : 0

  // Conformidade média e NCs
  const inspecoesLista = inspecoesMes.data ?? []
  const conformidadeMedia = inspecoesLista.length > 0
    ? Math.round(inspecoesLista.reduce((acc, i) => acc + (i.percentual_conformidade ?? 0), 0) / inspecoesLista.length)
    : null
  const ncsTotal = inspecoesLista.reduce((acc, i) => {
    const respostas = (i.respostas as Array<{ conforme: string }>) ?? []
    return acc + respostas.filter(r => r.conforme === "nao").length
  }, 0)

  // Documentos emitidos agrupados por tipo
  const docsPorTipo = new Map<string, number>()
  for (const d of docsMes.data ?? []) {
    docsPorTipo.set(d.tipo, (docsPorTipo.get(d.tipo) ?? 0) + 1)
  }
  const totalDocs = docsMes.count ?? 0

  // DDS: conta total e participantes
  const ddsLista = ddsMes.data ?? []
  const totalParticipantesDds = ddsLista.reduce((acc, d) => {
    const c = d.conteudo as { participantes?: unknown[] } | null
    return acc + (Array.isArray(c?.participantes) ? c.participantes.length : 0)
  }, 0)

  // Variação vs mês anterior
  const varOcorrencias = variacaoPct(ocorrencias.length, ocorrAnteriorTotal)

  // Top 5 tipos do mês
  const contagem = new Map<string, number>()
  ocorrencias.forEach(o => contagem.set(o.tipo, (contagem.get(o.tipo) ?? 0) + 1))
  const topDesvios = Array.from(contagem.entries())
    .map(([tipo, count]) => ({ label: OCORRENCIA_TIPOS[tipo] ?? tipo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const TIPO_DOC_LABEL: Record<string, string> = {
    apr: "APR", pt: "PT",
    autorizacao_nr10: "Autorização NR-10",
    autorizacao_nr35: "Autorização NR-35",
    autorizacao_nr33: "Autorização NR-33",
    os_seguranca: "Ordem de Serviço",
    dialogo_seguranca: "DDS",
  }

  return (
    <div className="container py-8 space-y-6 print:py-0 print:space-y-4">
      {/* Cabeçalho com seletor de mês — escondido ao imprimir */}
      <div className="flex items-center justify-between gap-4 flex-wrap print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório gerencial mensal</h1>
          <p className="text-muted-foreground">
            Consolidação dos indicadores SST do mês — pronto para apresentação à liderança.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form>
            <SubmitOnChangeSelect
              name="mes"
              defaultValue={`${ref.ano}-${String(ref.mes).padStart(2, "0")}`}
            >
              {meses.map((m) => (
                <option key={`${m.ano}-${m.mes}`} value={`${m.ano}-${String(m.mes).padStart(2, "0")}`}>
                  {m.label}
                </option>
              ))}
            </SubmitOnChangeSelect>
          </form>
          <PrintButton />
        </div>
      </div>

      {/* Header impressão: só aparece no print */}
      <div className="hidden print:flex print:items-center print:justify-between print:border-b print:pb-4 print:mb-4">
        <div>
          <div className="font-bold text-lg">{empresaPropria?.razao_social ?? (brand.companyName || brand.appName)}</div>
          <div className="text-xs text-muted-foreground">
            {empresaPropria?.cnpj ? `CNPJ ${empresaPropria.cnpj}` : ""}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Relatório gerado em {new Date().toLocaleString("pt-BR")}
        </div>
      </div>

      {/* Título do relatório */}
      <div className="print:text-center print:border-b print:pb-3">
        <h2 className="text-2xl font-bold tracking-tight print:text-xl">
          Relatório Gerencial de SST — {ref.label}
        </h2>
      </div>

      {/* ===== BLOCO 1: KPIs PRINCIPAIS ===== */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />1. Indicadores do mês
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <KpiCard
            label="Acidentes com afastamento"
            value={acidentesComAfastMes}
            subtitle={`Total de ocorrências: ${ocorrencias.length}`}
            tone={acidentesComAfastMes > 0 ? "vencido" : "regular"}
          />
          <KpiCard
            label="Dias perdidos"
            value={diasPerdidosMes}
            subtitle="Soma das ausências por acidente"
            tone={diasPerdidosMes > 0 ? "alerta" : "regular"}
          />
          <KpiCard
            label="Dias sem acidentes"
            value={diasSemAcidentes}
            subtitle="Desde o último com afastamento"
            tone="regular"
          />
          <KpiCard
            label="Taxa de Frequência (TF)"
            value={tfMes.toFixed(2)}
            subtitle={`${acidentesComAfastMes} × 10⁶ / ${hhtMes.toLocaleString("pt-BR")} HHT (estimado)`}
          />
          <KpiCard
            label="Taxa de Gravidade (TG)"
            value={tgMes.toFixed(2)}
            subtitle={`${diasPerdidosMes} dias perdidos × 10⁶ / HHT`}
          />
          <KpiCard
            label="Ocorrências vs. mês anterior"
            value={`${varOcorrencias.direcao === "subiu" ? "+" : varOcorrencias.direcao === "caiu" ? "−" : ""}${Math.abs(varOcorrencias.valor)}`}
            subtitle={`${varOcorrencias.pct}% vs ${ocorrAnteriorTotal} em ${anterior.label}`}
            tone={varOcorrencias.direcao === "subiu" ? "alerta" : varOcorrencias.direcao === "caiu" ? "regular" : undefined}
            trend={varOcorrencias.direcao}
          />
        </div>
      </section>

      {/* ===== BLOCO 2: COMPLIANCE ===== */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />2. Conformidade — situação atual
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <PctCard label="Exames médicos em dia" pct={pctExames} total={examesVigentes.count ?? 0} of={nColab} />
          <PctCard label="Treinamentos em dia" pct={pctTreinamentos} total={treinamentosVigentes.count ?? 0} of={nColab} />
          <PctCard label="Conformidade inspeções" pct={conformidadeMedia ?? 0} total={inspecoesLista.length} of={null} unit="inspeção(ões)" />
        </div>
      </section>

      {/* ===== BLOCO 3: ATIVIDADE DO MÊS ===== */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />3. Atividade do mês
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <AtividadeCard icon={<FileText />} label="Documentos emitidos" value={totalDocs} />
          <AtividadeCard icon={<MessageSquare />} label="DDS realizados" value={ddsLista.length} subtitle={`${totalParticipantesDds} participante(s)`} />
          <AtividadeCard icon={<ClipboardCheck />} label="Inspeções" value={inspecoesLista.length} subtitle={`${ncsTotal} NC registradas`} />
          <AtividadeCard icon={<GraduationCap />} label="Treinamentos realizados" value={treinamentosMes.count ?? 0} />
          <AtividadeCard icon={<HeartPulse />} label="Exames realizados" value={examesMes.count ?? 0} />
          <AtividadeCard icon={<Users />} label="Colaboradores ativos" value={nColab} />
        </div>

        {docsPorTipo.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos emitidos por tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from(docsPorTipo.entries()).map(([tipo, count]) => (
                  <Badge key={tipo} variant="outline" className="py-1">
                    {TIPO_DOC_LABEL[tipo] ?? tipo}: <strong className="ml-1">{count}</strong>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ===== BLOCO 4: OCORRÊNCIAS DO MÊS ===== */}
      {ocorrencias.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-alerta" />4. Ocorrências detalhadas
          </h3>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Envolvido</TableHead>
                    <TableHead>Gravidade</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ocorrencias.map((o) => {
                    const c = Array.isArray(o.colaboradores) ? o.colaboradores[0] : o.colaboradores
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(o.data_ocorrencia)}</TableCell>
                        <TableCell>{OCORRENCIA_TIPOS[o.tipo] ?? o.tipo}</TableCell>
                        <TableCell>{o.local}</TableCell>
                        <TableCell>{c?.nome_completo ?? "—"}</TableCell>
                        <TableCell>
                          {o.gravidade ? (
                            <Badge variant={gravidadeVariant(o.gravidade)}>{GRAVIDADE_LABEL[o.gravidade]}</Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">{o.dias_afastamento ?? "—"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {topDesvios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 tipos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topDesvios.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 text-sm">{d.label}</div>
                    <div className="font-mono font-bold">{d.count}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* ===== BLOCO 5: VENCIMENTOS CRÍTICOS ===== */}
      {(vencCriticos.data?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-status-critico" />
            {ocorrencias.length > 0 ? "5." : "4."} Vencimentos críticos — ação imediata
          </h3>
          <Card className="border-status-critico">
            <CardHeader>
              <CardDescription>
                {vencCriticos.data?.length} item(ns) vencendo em ≤30 dias ou já vencidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(vencCriticos.data ?? []).map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs uppercase text-muted-foreground">{v.categoria}</TableCell>
                      <TableCell>{v.item}</TableCell>
                      <TableCell>{v.colaborador ?? "—"}</TableCell>
                      <TableCell>{formatDate(v.data_vencimento)}</TableCell>
                      <TableCell>
                        <Badge variant={urgenciaBadgeVariant(v.urgencia as Urgencia)}>
                          {urgenciaLabel(v.urgencia as Urgencia)}
                        </Badge>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {v.dias_restantes < 0
                            ? `${Math.abs(v.dias_restantes)} dias atrás`
                            : `em ${v.dias_restantes} dias`}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="print:hidden pt-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard">Voltar ao dashboard</Link>
        </Button>
      </div>

      <footer className="hidden print:block print:mt-8 print:pt-3 print:border-t text-xs text-muted-foreground text-center">
        Documento gerado automaticamente pelo Sistema de Gestão de SST — {empresaPropria?.razao_social ?? (brand.companyName || brand.appName)}
      </footer>
    </div>
  )
}

function KpiCard({
  label, value, subtitle, tone, trend,
}: {
  label: string
  value: string | number
  subtitle?: string
  tone?: "regular" | "alerta" | "vencido"
  trend?: "subiu" | "caiu" | "igual"
}) {
  const toneClassMap = {
    regular: "border-status-regular",
    alerta: "border-status-alerta",
    vencido: "border-status-vencido",
  } as const
  const toneClass = tone ? toneClassMap[tone] : ""

  const valueColor = tone === "regular" ? "text-status-regular"
    : tone === "alerta" ? "text-status-alerta"
    : tone === "vencido" ? "text-status-vencido"
    : ""

  return (
    <Card className={toneClass}>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs">{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold flex items-center gap-2 ${valueColor}`}>
          {value}
          {trend && (
            trend === "subiu" ? <TrendingUp className="h-4 w-4" />
            : trend === "caiu" ? <TrendingDown className="h-4 w-4" />
            : <Minus className="h-4 w-4" />
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function PctCard({ label, pct, total, of, unit }: { label: string; pct: number; total: number; of: number | null; unit?: string }) {
  const color = pct >= 90 ? "text-status-regular" : pct >= 70 ? "text-status-alerta" : pct >= 50 ? "text-status-critico" : "text-status-vencido"
  const bgColor = pct >= 90 ? "bg-status-regular" : pct >= 70 ? "bg-status-alerta" : pct >= 50 ? "bg-status-critico" : "bg-status-vencido"
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs">{label}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={`text-2xl font-bold ${color}`}>{pct}%</div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${bgColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {total} {unit ?? "vigente(s)"}{of !== null ? ` de ${of}` : ""}
        </p>
      </CardContent>
    </Card>
  )
}

function AtividadeCard({
  icon, label, value, subtitle,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtitle?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-xs">{label}</CardDescription>
        <div className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function gravidadeVariant(g: string | null): BadgeProps["variant"] {
  switch (g) {
    case "fatal": case "grave": return "vencido"
    case "moderado": return "critico"
    case "leve": return "alerta"
    default: return "secondary"
  }
}

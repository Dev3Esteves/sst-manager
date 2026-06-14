import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OCORRENCIA_TIPOS, GRAVIDADE_LABEL } from "@/lib/validations/ocorrencia"
import { OcorrenciasTreemap, type TreemapCell } from "./charts"
import { MapPin, AlertTriangle, TrendingUp, Filter } from "lucide-react"
import { SubmitOnChangeSelect } from "@/components/ui/submit-on-change-select"

const PERIODOS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "180", label: "Últimos 180 dias" },
  { value: "365", label: "Último ano" },
  { value: "all", label: "Todo o período" },
] as const

// Ordem de severidade para comparação (maior = pior)
const GRAVIDADE_RANK: Record<string, number> = {
  leve: 1, moderado: 2, grave: 3, fatal: 4,
}

// Cores HSL que seguem a paleta SST
const CORES_GRAVIDADE = {
  fatal: "hsl(0, 72%, 42%)",      // vermelho-700
  grave: "hsl(0, 72%, 50%)",      // vermelho mais claro
  moderado: "hsl(24, 95%, 43%)",  // laranja-600
  leve: "hsl(45, 93%, 47%)",      // amarelo-500
  null: "hsl(215, 20%, 55%)",     // cinza neutro (sem gravidade informada)
} as const

// Escala de intensidade para matrix cells (background)
function intensidadeCor(count: number, max: number): string {
  if (count === 0) return "transparent"
  const ratio = Math.min(1, count / Math.max(1, max))
  // Azul slate com opacidade escalando 0.1 → 0.9
  const alpha = 0.1 + ratio * 0.8
  return `hsla(215, 28%, 17%, ${alpha})`
}

export default async function HeatmapPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const params = await searchParams
  const periodo = params.periodo && PERIODOS.some((p) => p.value === params.periodo)
    ? params.periodo
    : "90"

  const supabase = await createClient()

  let query = supabase
    .from("ocorrencias")
    .select("id, tipo, data_ocorrencia, local, gravidade")
    .order("data_ocorrencia", { ascending: false })

  if (periodo !== "all") {
    const dias = parseInt(periodo, 10)
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - dias)
    query = query.gte("data_ocorrencia", inicio.toISOString())
  }

  const { data: ocorrencias, error } = await query

  const lista = ocorrencias ?? []

  // ====== Agregações ======
  // Por local: { count, gravidadeMaxima, tipos[] }
  const porLocal = new Map<string, {
    count: number
    gravidadeMaxima: keyof typeof CORES_GRAVIDADE
    porTipo: Map<string, number>
  }>()

  // Por tipo (total)
  const porTipo = new Map<string, number>()

  for (const o of lista) {
    const local = (o.local ?? "").trim() || "(sem local)"
    const tipo = o.tipo

    const l = porLocal.get(local) ?? {
      count: 0,
      gravidadeMaxima: "null" as keyof typeof CORES_GRAVIDADE,
      porTipo: new Map<string, number>(),
    }
    l.count++
    l.porTipo.set(tipo, (l.porTipo.get(tipo) ?? 0) + 1)
    if (o.gravidade) {
      const rankAtual = GRAVIDADE_RANK[l.gravidadeMaxima] ?? 0
      const rankNovo = GRAVIDADE_RANK[o.gravidade] ?? 0
      if (rankNovo > rankAtual) {
        l.gravidadeMaxima = o.gravidade as keyof typeof CORES_GRAVIDADE
      }
    }
    porLocal.set(local, l)

    porTipo.set(tipo, (porTipo.get(tipo) ?? 0) + 1)
  }

  const treemapData: TreemapCell[] = Array.from(porLocal.entries())
    .map(([name, d]) => ({
      name,
      count: d.count,
      peso: d.count,
      gravidadeMaxima: d.gravidadeMaxima === "null" ? null : d.gravidadeMaxima,
      color: CORES_GRAVIDADE[d.gravidadeMaxima],
    }))
    .sort((a, b) => b.count - a.count)

  // Top locais para ranking e matrix
  const topLocais = treemapData.slice(0, 15)
  const tiposOrdenados = Array.from(porTipo.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8) // top 8 tipos para a matrix
    .map(([t]) => t)

  // Máximo valor de célula na matrix (para escala de cor)
  const maxCelula = Math.max(
    1,
    ...topLocais.flatMap((l) => {
      const d = porLocal.get(l.name)!
      return tiposOrdenados.map((t) => d.porTipo.get(t) ?? 0)
    }),
  )

  const totalOcorrencias = lista.length
  const locaisUnicos = porLocal.size
  const localTop = treemapData[0]

  const periodoLabel = PERIODOS.find((p) => p.value === periodo)?.label ?? ""

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-7 w-7" />
            Heatmap de ocorrências por local
          </h1>
          <p className="text-muted-foreground">
            Identifique hotspots de risco na operação — onde concentra eventos e onde estão os mais graves.
          </p>
        </div>
        <form>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <SubmitOnChangeSelect name="periodo" defaultValue={periodo}>
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </SubmitOnChangeSelect>
          </div>
        </form>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de ocorrências</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOcorrencias}</div>
            <p className="text-xs text-muted-foreground mt-1">{periodoLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Locais distintos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{locaisUnicos}</div>
            <p className="text-xs text-muted-foreground mt-1">Endereços/áreas com ao menos 1 registro</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Local com mais eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate" title={localTop?.name}>
              {localTop?.name ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {localTop?.count ?? 0} ocorrência(s)
              {localTop?.gravidadeMaxima && ` · pior gravidade: ${localTop.gravidadeMaxima}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Treemap — tamanho = frequência, cor = pior gravidade registrada
          </CardTitle>
          <CardDescription>
            Quanto maior o retângulo, mais ocorrências no local. A cor mostra a gravidade máxima (vermelho = fatal/grave, laranja = moderado, amarelo = leve, cinza = sem gravidade informada).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OcorrenciasTreemap data={treemapData} />
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <LegendItem color={CORES_GRAVIDADE.fatal} label="Fatal" />
            <LegendItem color={CORES_GRAVIDADE.grave} label="Grave" />
            <LegendItem color={CORES_GRAVIDADE.moderado} label="Moderado" />
            <LegendItem color={CORES_GRAVIDADE.leve} label="Leve" />
            <LegendItem color={CORES_GRAVIDADE.null} label="Sem gravidade informada" />
          </div>
        </CardContent>
      </Card>

      {topLocais.length > 0 && tiposOrdenados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matriz local × tipo de ocorrência</CardTitle>
            <CardDescription>
              Intensidade do azul é proporcional ao número de eventos. Top 15 locais e top 8 tipos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b sticky left-0 bg-background min-w-[160px]">
                      Local
                    </th>
                    {tiposOrdenados.map((t) => (
                      <th
                        key={t}
                        className="p-2 border-b text-center font-medium whitespace-nowrap"
                        style={{ writingMode: "vertical-rl", minWidth: 32, height: 90 }}
                      >
                        {OCORRENCIA_TIPOS[t] ?? t}
                      </th>
                    ))}
                    <th className="p-2 border-b text-center font-semibold bg-muted/50">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topLocais.map((l) => {
                    const d = porLocal.get(l.name)!
                    return (
                      <tr key={l.name} className="border-b last:border-b-0">
                        <td className="p-2 font-medium sticky left-0 bg-background" title={l.name}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: l.color }}
                            />
                            <span className="truncate max-w-[180px]">{l.name}</span>
                          </div>
                        </td>
                        {tiposOrdenados.map((t) => {
                          const count = d.porTipo.get(t) ?? 0
                          return (
                            <td
                              key={t}
                              className="p-2 text-center font-mono"
                              style={{
                                backgroundColor: intensidadeCor(count, maxCelula),
                                color: count / maxCelula > 0.5 ? "white" : undefined,
                              }}
                            >
                              {count || ""}
                            </td>
                          )
                        })}
                        <td className="p-2 text-center font-bold bg-muted/50">{d.count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {topLocais.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-alerta" />
              Ranking — top {Math.min(15, topLocais.length)} locais
            </CardTitle>
            <CardDescription>
              Priorize intervenções de SST pelos locais do topo — são os que concentram mais riscos concretizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topLocais.map((l, i) => (
              <div key={l.name} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.count} ocorrência(s)
                    {l.gravidadeMaxima && ` · pior: ${GRAVIDADE_LABEL[l.gravidadeMaxima]}`}
                  </div>
                </div>
                {l.gravidadeMaxima && (
                  <Badge
                    variant={
                      l.gravidadeMaxima === "fatal" || l.gravidadeMaxima === "grave" ? "vencido"
                      : l.gravidadeMaxima === "moderado" ? "critico"
                      : "alerta"
                    }
                  >
                    {GRAVIDADE_LABEL[l.gravidadeMaxima]}
                  </Badge>
                )}
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full"
                    style={{
                      width: `${(l.count / (treemapData[0]?.count || 1)) * 100}%`,
                      backgroundColor: l.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalOcorrencias === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="mx-auto h-10 w-10 opacity-30 mb-2" />
            {error ? (
              <span className="text-destructive" role="alert">Não foi possível carregar as ocorrências. Recarregue a página.</span>
            ) : (
              "Nenhuma ocorrência registrada no período. Ajuste o filtro ou registre ocorrências."
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" asChild>
          <Link href="/relatorios/mensal">Relatório mensal</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/ocorrencias">Ver ocorrências</Link>
        </Button>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}

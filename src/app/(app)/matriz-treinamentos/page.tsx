import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { classificarVencimento, formatDate } from "@/lib/utils/vencimento"
import { CheckCircle2, AlertTriangle, XCircle, Minus } from "lucide-react"

type RealizacaoPorColab = {
  colaborador_id: string
  treinamento_id: string
  nr_referencia: string | null
  titulo: string
  data_vencimento: string | null
  urgencia: "regular" | "alerta" | "critico" | "vencido" | null
}

type Gap = {
  status: "em_dia" | "alerta" | "critico" | "vencido" | "faltando" | "na"
  data_vencimento: string | null
}

function iconAndVariant(status: Gap["status"]): { icon: React.ReactNode; variant: BadgeProps["variant"] | "muted" } {
  switch (status) {
    case "em_dia": return { icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "regular" }
    case "alerta": return { icon: <AlertTriangle className="h-3.5 w-3.5" />, variant: "alerta" }
    case "critico": return { icon: <AlertTriangle className="h-3.5 w-3.5" />, variant: "critico" }
    case "vencido": return { icon: <XCircle className="h-3.5 w-3.5" />, variant: "vencido" }
    case "faltando": return { icon: <XCircle className="h-3.5 w-3.5" />, variant: "vencido" }
    case "na":
    default: return { icon: <Minus className="h-3.5 w-3.5" />, variant: "muted" }
  }
}

export default async function MatrizTreinamentosPage() {
  const supabase = await createClient()

  const [
    { data: cargos },
    { data: colaboradores },
    { data: treinamentos },
    { data: realizacoes },
  ] = await Promise.all([
    supabase.from("cargos").select("id, titulo, nrs_aplicaveis"),
    supabase.from("colaboradores").select("id, nome_completo, matricula, cargo_id").eq("status", "ativo").order("nome_completo"),
    supabase.from("treinamentos").select("id, titulo, nr_referencia"),
    supabase.from("treinamentos_realizados")
      .select("colaborador_id, treinamento_id, data_vencimento, treinamentos(titulo, nr_referencia)")
      .eq("status", "vigente"),
  ])

  // Mapa: cargo_id → lista de treinamentos obrigatórios (por NR)
  const treinPorNr = new Map<string, { id: string; titulo: string; nr: string }[]>()
  for (const t of treinamentos ?? []) {
    if (!t.nr_referencia) continue
    const list = treinPorNr.get(t.nr_referencia) ?? []
    list.push({ id: t.id, titulo: t.titulo, nr: t.nr_referencia })
    treinPorNr.set(t.nr_referencia, list)
  }

  const realizacoesPorColab = new Map<string, RealizacaoPorColab[]>()
  for (const r of realizacoes ?? []) {
    const tr = Array.isArray(r.treinamentos) ? r.treinamentos[0] : r.treinamentos
    const entry: RealizacaoPorColab = {
      colaborador_id: r.colaborador_id,
      treinamento_id: r.treinamento_id,
      nr_referencia: tr?.nr_referencia ?? null,
      titulo: tr?.titulo ?? "",
      data_vencimento: r.data_vencimento,
      urgencia: classificarVencimento(r.data_vencimento),
    }
    const list = realizacoesPorColab.get(r.colaborador_id) ?? []
    list.push(entry)
    realizacoesPorColab.set(r.colaborador_id, list)
  }

  // Agrupa colaboradores por cargo
  const colabPorCargo = new Map<string, typeof colaboradores>()
  for (const c of colaboradores ?? []) {
    const cargoId = c.cargo_id ?? "__sem_cargo__"
    const list = colabPorCargo.get(cargoId) ?? []
    list.push(c)
    colabPorCargo.set(cargoId, list)
  }

  // Para cada cargo, listar treinamentos obrigatórios (união dos treinamentos por NR do cargo)
  const cargoMatriz = (cargos ?? [])
    .filter((cargo) => (colabPorCargo.get(cargo.id)?.length ?? 0) > 0)
    .map((cargo) => {
      const nrs = (cargo.nrs_aplicaveis as string[] | null) ?? []
      const treinsObrigatorios = nrs.flatMap((nr) => treinPorNr.get(nr) ?? [])
      // dedupe por id
      const unicos = Array.from(new Map(treinsObrigatorios.map((t) => [t.id, t])).values())
      return {
        cargo,
        treinamentosObrigatorios: unicos,
        colaboradoresDoCargo: colabPorCargo.get(cargo.id) ?? [],
      }
    })

  // Estatísticas globais
  let totalRequisitos = 0
  let emDia = 0
  let vencendo = 0
  let faltando = 0

  for (const { treinamentosObrigatorios, colaboradoresDoCargo } of cargoMatriz) {
    for (const colab of colaboradoresDoCargo) {
      for (const treino of treinamentosObrigatorios) {
        totalRequisitos++
        const vigentes = realizacoesPorColab.get(colab.id) ?? []
        const hit = vigentes.find((r) => r.treinamento_id === treino.id)
        if (!hit) faltando++
        else if (hit.urgencia === "vencido") faltando++
        else if (hit.urgencia === "critico" || hit.urgencia === "alerta") vencendo++
        else emDia++
      }
    }
  }

  const pctEmDia = totalRequisitos > 0 ? Math.round((emDia / totalRequisitos) * 100) : 100

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Matriz de Treinamentos</h1>
        <p className="text-muted-foreground">
          Gap analysis: quais treinamentos cada colaborador deveria ter (conforme NRs do cargo) e quais realmente estão vigentes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Cobertura" value={`${pctEmDia}%`} tone={pctEmDia >= 90 ? "regular" : pctEmDia >= 70 ? "alerta" : "vencido"} />
        <SummaryCard label="Em dia" value={emDia.toString()} tone="regular" />
        <SummaryCard label="Vencendo" value={vencendo.toString()} tone="alerta" />
        <SummaryCard label="Faltando / vencido" value={faltando.toString()} tone="vencido" />
      </div>

      {cargoMatriz.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum cargo com colaboradores ativos. Cadastre colaboradores e vincule-os a cargos com NRs aplicáveis.
          </CardContent>
        </Card>
      )}

      {cargoMatriz.map(({ cargo, treinamentosObrigatorios, colaboradoresDoCargo }) => {
        const nrs = (cargo.nrs_aplicaveis as string[] | null) ?? []
        return (
          <Card key={cargo.id}>
            <CardHeader>
              <CardTitle className="text-lg">{cargo.titulo}</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                <span>{colaboradoresDoCargo.length} colaborador(es)</span>
                {nrs.length > 0 && (
                  <span className="flex gap-1">
                    {nrs.map((nr) => <Badge key={nr} variant="outline" className="text-[10px]">{nr}</Badge>)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {treinamentosObrigatorios.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Cargo sem treinamentos obrigatórios mapeados. Cadastre treinamentos com a NR correspondente para habilitar o gap analysis.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background min-w-[180px]">Colaborador</TableHead>
                      {treinamentosObrigatorios.map((t) => (
                        <TableHead key={t.id} className="text-center min-w-[100px]">
                          <div className="text-xs font-medium whitespace-normal">{t.titulo}</div>
                          <Badge variant="outline" className="text-[10px] mt-1">{t.nr}</Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colaboradoresDoCargo.map((colab) => {
                      const vigentes = realizacoesPorColab.get(colab.id) ?? []
                      return (
                        <TableRow key={colab.id}>
                          <TableCell className="sticky left-0 bg-background">
                            <div className="font-medium text-sm">{colab.nome_completo}</div>
                            {colab.matricula && (
                              <div className="text-[11px] text-muted-foreground">Mat. {colab.matricula}</div>
                            )}
                          </TableCell>
                          {treinamentosObrigatorios.map((treino) => {
                            const hit = vigentes.find((r) => r.treinamento_id === treino.id)
                            let status: Gap["status"]
                            if (!hit) status = "faltando"
                            else if (hit.urgencia === "vencido") status = "vencido"
                            else if (hit.urgencia === "critico") status = "critico"
                            else if (hit.urgencia === "alerta") status = "alerta"
                            else status = "em_dia"

                            const gap: Gap = { status, data_vencimento: hit?.data_vencimento ?? null }
                            return <StatusCell key={treino.id} gap={gap} />
                          })}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legenda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-xs">
          <LegendItem status="em_dia" label="Em dia" />
          <LegendItem status="alerta" label="Vence em ≤60d" />
          <LegendItem status="critico" label="Vence em ≤30d" />
          <LegendItem status="vencido" label="Vencido" />
          <LegendItem status="faltando" label="Nunca realizado" />
        </CardContent>
      </Card>
    </div>
  )
}

function StatusCell({ gap }: { gap: Gap }) {
  const { icon, variant } = iconAndVariant(gap.status)
  const label = gap.status === "em_dia" ? "OK"
    : gap.status === "alerta" ? "Alerta"
    : gap.status === "critico" ? "Crítico"
    : gap.status === "vencido" ? "Vencido"
    : gap.status === "faltando" ? "Faltando"
    : "—"

  return (
    <TableCell className="text-center p-2">
      <div className="flex flex-col items-center gap-1" title={gap.data_vencimento ? `Vence: ${formatDate(gap.data_vencimento)}` : undefined}>
        <Badge variant={variant === "muted" ? "secondary" : variant} className="text-[10px] py-0.5 px-1.5 flex items-center gap-1">
          {icon}
          {label}
        </Badge>
        {gap.data_vencimento && (
          <span className="text-[10px] text-muted-foreground">{formatDate(gap.data_vencimento)}</span>
        )}
      </div>
    </TableCell>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "regular" | "alerta" | "vencido" }) {
  const colorMap = {
    regular: "text-status-regular border-status-regular",
    alerta: "text-status-alerta border-status-alerta",
    vencido: "text-status-vencido border-status-vencido",
  }
  return (
    <Card className={value !== "0" ? colorMap[tone] : ""}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorMap[tone].split(" ")[0]}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function LegendItem({ status, label }: { status: Gap["status"]; label: string }) {
  const { icon, variant } = iconAndVariant(status)
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant === "muted" ? "secondary" : variant} className="text-[10px] py-0.5 px-1.5 flex items-center gap-1">
        {icon}
        {status === "em_dia" ? "OK" : status === "faltando" ? "Faltando" : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

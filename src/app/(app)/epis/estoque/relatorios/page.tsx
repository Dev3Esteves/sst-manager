import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import {
  curvaAbc, pontoPedido, consumoMedioDiario, coberturaDias, giroEstoque, emRuptura, valorizacaoTotal,
} from "@/lib/estoque/calculos"
import { classificarVencimento, urgenciaBadgeVariant, urgenciaLabel, formatDate } from "@/lib/utils/vencimento"
import { FileBarChart, ArrowLeft, TrendingUp, AlertTriangle, CalendarClock, Boxes, RotateCw } from "lucide-react"

const JANELA_DIAS = 180

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })

export default async function EstoqueRelatoriosPage() {
  const supabase = await createClient()

  // Janela de 180 dias para consumo (saídas).
  const desde = new Date()
  desde.setDate(desde.getDate() - JANELA_DIAS)
  const desdeIso = desde.toISOString()

  const [
    { data: epis },
    { data: locais },
    { data: saldos },
    { data: parametros },
    { data: lotes },
    { data: saidas },
  ] = await Promise.all([
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
    supabase.from("estoque_local").select("id, nome"),
    supabase.from("estoque_saldo").select("epi_id, local_id, quantidade, custo_total"),
    supabase.from("estoque_parametro").select("epi_id, local_id, ponto_pedido, consumo_medio, estoque_seguranca, lead_time_dias"),
    supabase.from("estoque_lote").select("epi_id, local_id, lote, validade, saldo").gt("saldo", 0),
    supabase.from("estoque_movimentacao").select("epi_id, quantidade, custo_total").eq("tipo", "saida").gte("data", desdeIso),
  ])

  const epiNome = new Map<string, { descricao: string; ca: string | null }>()
  for (const e of epis ?? []) epiNome.set(e.id, { descricao: e.descricao, ca: e.ca })
  const localNome = new Map<string, string>()
  for (const l of locais ?? []) localNome.set(l.id, l.nome)

  // ===== (a) Curva ABC: valor consumido = soma custo_total das saídas (180d) por EPI =====
  const valorConsumidoPorEpi = new Map<string, number>()
  const qtdSaidaPorEpi = new Map<string, number>()
  for (const s of saidas ?? []) {
    valorConsumidoPorEpi.set(s.epi_id, (valorConsumidoPorEpi.get(s.epi_id) ?? 0) + (Number(s.custo_total) || 0))
    qtdSaidaPorEpi.set(s.epi_id, (qtdSaidaPorEpi.get(s.epi_id) ?? 0) + (Number(s.quantidade) || 0))
  }
  const itensAbc = (epis ?? []).map((e) => ({ id: e.id, valorConsumido: valorConsumidoPorEpi.get(e.id) ?? 0 }))
  const classes = curvaAbc(itensAbc)
  const abc = itensAbc
    .map((i) => ({ ...i, classe: classes.get(i.id) ?? "C", descricao: epiNome.get(i.id)?.descricao ?? "—", ca: epiNome.get(i.id)?.ca ?? null }))
    .filter((i) => i.valorConsumido > 0)
    .sort((a, b) => b.valorConsumido - a.valorConsumido)
  const contagemClasse = { A: 0, B: 0, C: 0 }
  classes.forEach((c) => { contagemClasse[c]++ })

  // ===== Saldo agregado por EPI (soma de todos os locais) =====
  const saldoPorEpi = new Map<string, number>()
  for (const s of saldos ?? []) {
    saldoPorEpi.set(s.epi_id, (saldoPorEpi.get(s.epi_id) ?? 0) + (Number(s.quantidade) || 0))
  }

  // Parâmetro padrão (local_id null) por EPI — usado p/ ponto de pedido e consumo.
  const paramEmpresa = new Map<string, { ponto_pedido: number | null; consumo_medio: number | null; estoque_seguranca: number; lead_time_dias: number }>()
  for (const p of parametros ?? []) {
    if (p.local_id) continue
    paramEmpresa.set(p.epi_id, {
      ponto_pedido: p.ponto_pedido != null ? Number(p.ponto_pedido) : null,
      consumo_medio: p.consumo_medio != null ? Number(p.consumo_medio) : null,
      estoque_seguranca: Number(p.estoque_seguranca ?? 0),
      lead_time_dias: Number(p.lead_time_dias ?? 0),
    })
  }

  // ===== (b) Ruptura: saldo agregado ≤ ponto de pedido =====
  const ruptura: { epi_id: string; descricao: string; ca: string | null; saldo: number; ponto: number }[] = []
  for (const e of epis ?? []) {
    const p = paramEmpresa.get(e.id)
    if (!p) continue
    const consumoDiario = p.consumo_medio ?? 0
    const ponto = p.ponto_pedido ?? pontoPedido(consumoDiario, p.lead_time_dias, p.estoque_seguranca)
    const saldo = saldoPorEpi.get(e.id) ?? 0
    if (emRuptura(saldo, ponto)) {
      ruptura.push({ epi_id: e.id, descricao: e.descricao, ca: e.ca, saldo, ponto })
    }
  }
  ruptura.sort((a, b) => a.saldo - b.saldo)

  // ===== (c) Validade FEFO: lotes vencendo, ordenados pela validade (FEFO) =====
  const lotesVencendo = (lotes ?? [])
    .filter((l) => l.validade && classificarVencimento(l.validade) !== "regular")
    .map((l) => ({
      epi: epiNome.get(l.epi_id)?.descricao ?? "—",
      ca: epiNome.get(l.epi_id)?.ca ?? null,
      local: localNome.get(l.local_id) ?? "—",
      lote: l.lote as string | null,
      validade: l.validade as string,
      saldo: Number(l.saldo) || 0,
      urgencia: classificarVencimento(l.validade),
    }))
    .sort((a, b) => (a.validade < b.validade ? -1 : a.validade > b.validade ? 1 : 0))

  // ===== (d) Valorização total por local =====
  const valorPorLocal = new Map<string, number>()
  for (const s of saldos ?? []) {
    valorPorLocal.set(s.local_id, (valorPorLocal.get(s.local_id) ?? 0) + (Number(s.custo_total) || 0))
  }
  const valorizacaoLocais = Array.from(valorPorLocal.entries())
    .map(([localId, valor]) => ({ local: localNome.get(localId) ?? "—", valor }))
    .sort((a, b) => b.valor - a.valor)
  const valorizacaoGeral = valorizacaoTotal(saldos ?? [])

  // ===== (e) Giro / cobertura por EPI (consumo dos últimos 180d) =====
  const giroCobertura = (epis ?? [])
    .map((e) => {
      const saidasQtd = qtdSaidaPorEpi.get(e.id) ?? 0
      const saldo = saldoPorEpi.get(e.id) ?? 0
      const consumoDiario = consumoMedioDiario(saidasQtd, JANELA_DIAS)
      return {
        descricao: e.descricao,
        ca: e.ca,
        saidasQtd,
        saldo,
        consumoDiario,
        cobertura: coberturaDias(saldo, consumoDiario),
        giro: giroEstoque(saidasQtd, saldo),
      }
    })
    .filter((g) => g.saidasQtd > 0)
    .sort((a, b) => b.saidasQtd - a.saidasQtd)

  return (
    <div className="container py-8 space-y-6">
      <PageHeader
        icon={<FileBarChart />}
        title="Relatórios de estoque"
        description={`Curva ABC, ruptura, validade (FEFO), valorização e giro — janela de consumo: últimos ${JANELA_DIAS} dias.`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/epis/estoque"><ArrowLeft className="h-4 w-4" />Voltar aos saldos</Link>
          </Button>
        }
      />

      {/* ===== Cards-resumo ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResumoCard label="Valorização total" value={brl.format(valorizacaoGeral)} icon={<Boxes />} />
        <ResumoCard label="EPIs em ruptura" value={ruptura.length} icon={<AlertTriangle />} tone={ruptura.length > 0 ? "vencido" : "regular"} />
        <ResumoCard label="Lotes vencendo" value={lotesVencendo.length} icon={<CalendarClock />} tone={lotesVencendo.length > 0 ? "alerta" : "regular"} />
        <ResumoCard label="Classe A (críticos)" value={contagemClasse.A} icon={<TrendingUp />} subtitle={`B: ${contagemClasse.B} · C: ${contagemClasse.C}`} />
      </div>

      {/* ===== (a) Curva ABC ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Curva ABC por valor consumido</CardTitle>
          <CardDescription>Pareto do consumo (custo das saídas) nos últimos {JANELA_DIAS} dias. A: até 80% · B: até 95% · C: resto.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EPI</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead className="text-right">Valor consumido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abc.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="font-medium">{i.descricao}</div>
                    {i.ca && <div className="text-xs text-muted-foreground font-mono">CA {i.ca}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={i.classe === "A" ? "critico" : i.classe === "B" ? "alerta" : "secondary"}>{i.classe}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{brl.format(i.valorConsumido)}</TableCell>
                </TableRow>
              ))}
              {abc.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Sem saídas com custo no período.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== (b) Ruptura ===== */}
      <Card className={ruptura.length > 0 ? "border-status-vencido" : undefined}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Ruptura — reposição necessária</CardTitle>
          <CardDescription>EPIs cujo saldo total está no/abaixo do ponto de pedido (parâmetro gravado ou calculado).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EPI</TableHead>
                <TableHead className="text-right">Saldo atual</TableHead>
                <TableHead className="text-right">Ponto de pedido</TableHead>
                <TableHead className="text-right">Déficit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ruptura.map((r) => (
                <TableRow key={r.epi_id}>
                  <TableCell>
                    <div className="font-medium">{r.descricao}</div>
                    {r.ca && <div className="text-xs text-muted-foreground font-mono">CA {r.ca}</div>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{num(r.saldo)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(r.ponto)}</TableCell>
                  <TableCell className="text-right tabular-nums text-status-vencido font-medium">{num(Math.max(0, r.ponto - r.saldo))}</TableCell>
                </TableRow>
              ))}
              {ruptura.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum EPI em ruptura. Defina parâmetros para monitorar.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== (c) Validade FEFO ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" />Validade (FEFO) — lotes vencendo</CardTitle>
          <CardDescription>Lotes com saldo &gt; 0 ordenados pela validade (First Expired, First Out). Exclui validades regulares (&gt; 60 dias).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EPI</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lotesVencendo.map((l, i) => (
                <TableRow key={`${l.lote}-${i}`}>
                  <TableCell>
                    <div className="font-medium">{l.epi}</div>
                    {l.ca && <div className="text-xs text-muted-foreground font-mono">CA {l.ca}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{l.local}</TableCell>
                  <TableCell className="text-sm font-mono">{l.lote ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(l.validade)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(l.saldo)}</TableCell>
                  <TableCell><Badge variant={urgenciaBadgeVariant(l.urgencia)}>{urgenciaLabel(l.urgencia)}</Badge></TableCell>
                </TableRow>
              ))}
              {lotesVencendo.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhum lote vencendo nos próximos 60 dias.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== (d) Valorização por local ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Boxes className="h-4 w-4" />Valorização por local</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Valor em estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valorizacaoLocais.map((v, i) => (
                <TableRow key={i}>
                  <TableCell>{v.local}</TableCell>
                  <TableCell className="text-right tabular-nums">{brl.format(v.valor)}</TableCell>
                </TableRow>
              ))}
              {valorizacaoLocais.length > 0 && (
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{brl.format(valorizacaoGeral)}</TableCell>
                </TableRow>
              )}
              {valorizacaoLocais.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center py-6 text-muted-foreground">Sem saldo em estoque.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== (e) Giro / cobertura ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><RotateCw className="h-4 w-4" />Giro e cobertura por EPI</CardTitle>
          <CardDescription>Baseado no consumo (saídas) dos últimos {JANELA_DIAS} dias e no saldo atual.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EPI</TableHead>
                <TableHead className="text-right">Saídas (180d)</TableHead>
                <TableHead className="text-right">Consumo/dia</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Cobertura (dias)</TableHead>
                <TableHead className="text-right">Giro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giroCobertura.map((g, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-medium">{g.descricao}</div>
                    {g.ca && <div className="text-xs text-muted-foreground font-mono">CA {g.ca}</div>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{num(g.saidasQtd)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(g.consumoDiario)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(g.saldo)}</TableCell>
                  <TableCell className="text-right tabular-nums">{g.cobertura != null ? num(g.cobertura) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{g.giro != null ? num(g.giro) : "—"}</TableCell>
                </TableRow>
              ))}
              {giroCobertura.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Sem saídas no período para calcular giro.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ResumoCard({
  label, value, icon, subtitle, tone,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
  tone?: "regular" | "alerta" | "vencido"
}) {
  const valueColor = tone === "regular" ? "text-status-regular"
    : tone === "alerta" ? "text-status-alerta"
    : tone === "vencido" ? "text-status-vencido"
    : ""
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-xs">{label}</CardDescription>
        <div className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

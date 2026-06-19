import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Pagination, parsePageParam } from "@/components/pagination"
import { SubmitOnChangeSelect } from "@/components/ui/submit-on-change-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDataHora } from "@/lib/utils/data-brasilia"
import { TIPO_MOV_LABEL, type TipoMovimentacao } from "@/lib/estoque/tipos"
import { History, Filter } from "lucide-react"
import { EstoqueNav } from "../estoque-nav"

const PER_PAGE = 50

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

type EpiRel = { descricao: string; ca: string | null; unidade: string | null }
type LocalRel = { nome: string }

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

function tipoVariant(tipo: string): BadgeProps["variant"] {
  switch (tipo) {
    case "entrada": case "devolucao": return "regular"
    case "saida": return "critico"
    case "transferencia": return "secondary"
    case "perda": return "vencido"
    case "ajuste": return "alerta"
    default: return "outline"
  }
}

export default async function KardexPage({
  searchParams,
}: {
  searchParams: Promise<{ epi?: string; local?: string; tipo?: string; de?: string; ate?: string; page?: string }>
}) {
  const sp = await searchParams
  const epiFiltro = sp.epi && sp.epi !== "todos" ? sp.epi : undefined
  const localFiltro = sp.local && sp.local !== "todos" ? sp.local : undefined
  const tipoFiltro = sp.tipo && sp.tipo !== "todos" ? sp.tipo : undefined
  const de = sp.de || undefined
  const ate = sp.ate || undefined
  const page = parsePageParam(sp.page)
  const supabase = await createClient()

  // Opções de filtro: EPIs e locais.
  const [{ data: epis }, { data: locais }] = await Promise.all([
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
    supabase.from("estoque_local").select("id, nome").eq("ativo", true).order("nome"),
  ])

  // Movimentações (kardex) com join EPI + local + local destino.
  let query = supabase
    .from("estoque_movimentacao")
    .select(`
      id, tipo, epi_id, local_id, local_destino_id, quantidade,
      custo_unitario, custo_total, saldo_apos, origem, observacao, data,
      epi:epi_id(descricao, ca, unidade),
      local:local_id(nome),
      destino:local_destino_id(nome)
    `, { count: "exact" })
    .order("data", { ascending: false })
  if (epiFiltro) query = query.eq("epi_id", epiFiltro)
  if (localFiltro) query = query.eq("local_id", localFiltro)
  if (tipoFiltro) query = query.eq("tipo", tipoFiltro)
  if (de) query = query.gte("data", de)
  if (ate) query = query.lte("data", `${ate}T23:59:59`)
  query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  const { data: movs, count, error } = await query
  const total = count ?? 0

  return (
    <div className="container py-8 space-y-6">
      <PageHeader
        icon={<History />}
        title="Kardex"
        description="Histórico de movimentações de estoque (entradas, saídas, transferências e ajustes)."
      />

      <EstoqueNav atual="kardex" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" />Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="f-epi">EPI</Label>
              <SubmitOnChangeSelect name="epi" defaultValue={epiFiltro ?? "todos"}>
                <option value="todos">Todos</option>
                {(epis ?? []).map((e) => (
                  <option key={e.id} value={e.id}>{e.descricao}{e.ca ? ` (CA ${e.ca})` : ""}</option>
                ))}
              </SubmitOnChangeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-local">Local</Label>
              <SubmitOnChangeSelect name="local" defaultValue={localFiltro ?? "todos"}>
                <option value="todos">Todos</option>
                {(locais ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </SubmitOnChangeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-tipo">Tipo</Label>
              <SubmitOnChangeSelect name="tipo" defaultValue={tipoFiltro ?? "todos"}>
                <option value="todos">Todos</option>
                {(Object.entries(TIPO_MOV_LABEL) as [TipoMovimentacao, string][]).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </SubmitOnChangeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-de">De</Label>
              <Input id="f-de" name="de" type="date" defaultValue={de ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-ate">Até</Label>
              <Input id="f-ate" name="ate" type="date" defaultValue={ate ?? ""} />
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
              <Button type="submit" variant="secondary" size="sm">Aplicar período</Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/epis/estoque/kardex">Limpar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>EPI</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Custo unit.</TableHead>
                <TableHead className="text-right">Custo total</TableHead>
                <TableHead className="text-right">Saldo após</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(movs ?? []).map((m) => {
                const epi = one<EpiRel>(m.epi)
                const local = one<LocalRel>(m.local)
                const destino = one<LocalRel>(m.destino)
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDataHora(m.data)}</TableCell>
                    <TableCell><Badge variant={tipoVariant(m.tipo)}>{TIPO_MOV_LABEL[m.tipo as TipoMovimentacao] ?? m.tipo}</Badge></TableCell>
                    <TableCell>
                      <div className="font-medium">{epi?.descricao ?? "—"}</div>
                      {epi?.ca && <div className="text-xs text-muted-foreground font-mono">CA {epi.ca}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {local?.nome ?? "—"}
                      {destino && (
                        <span className="text-muted-foreground"> → {destino.nome}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{Number(m.quantidade ?? 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.custo_unitario != null ? brl.format(Number(m.custo_unitario)) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.custo_total != null ? brl.format(Number(m.custo_total)) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.saldo_apos != null ? Number(m.saldo_apos) : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">{m.origem ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[16rem] truncate" title={m.observacao ?? undefined}>{m.observacao ?? "—"}</TableCell>
                  </TableRow>
                )
              })}
              {total === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar o kardex. Recarregue a página.</span>
                    ) : (
                      <span className="text-muted-foreground">Nenhuma movimentação encontrada para os filtros.</span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            baseHref="/epis/estoque/kardex"
            currentPage={page}
            totalItems={total}
            perPage={PER_PAGE}
            currentParams={{ epi: epiFiltro, local: localFiltro, tipo: tipoFiltro, de, ate }}
            label="movimentações"
          />
        </CardContent>
      </Card>
    </div>
  )
}

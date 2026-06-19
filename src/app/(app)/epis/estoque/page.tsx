import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Pagination, parsePageParam } from "@/components/pagination"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { valorizacaoTotal, emRuptura } from "@/lib/estoque/calculos"
import { Boxes } from "lucide-react"
import { EstoqueNav } from "./estoque-nav"

const PER_PAGE = 25

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

type EpiRel = { descricao: string; ca: string | null; unidade: string | null }
type LocalRel = { nome: string; tipo: string }

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export default async function EstoqueSaldosPage({
  searchParams,
}: {
  searchParams: Promise<{ local?: string; page?: string }>
}) {
  const sp = await searchParams
  const localFiltro = sp.local && sp.local !== "todos" ? sp.local : undefined
  const page = parsePageParam(sp.page)
  const supabase = await createClient()

  // Locais para o filtro.
  const { data: locais } = await supabase
    .from("estoque_local")
    .select("id, nome, tipo")
    .eq("ativo", true)
    .order("nome")

  // Saldos (join EPI + Local).
  let query = supabase
    .from("estoque_saldo")
    .select(`
      epi_id, local_id, quantidade, custo_medio, custo_total,
      epi:epi_id(descricao, ca, unidade),
      local:local_id(nome, tipo)
    `)
  if (localFiltro) query = query.eq("local_id", localFiltro)
  const { data: saldos, error } = await query

  // Parâmetros (ponto de pedido) por EPI — específico do local OU da empresa (local_id null).
  const { data: parametros } = await supabase
    .from("estoque_parametro")
    .select("epi_id, local_id, ponto_pedido")

  // Mapa de ponto de pedido: prioriza o do local específico, cai para o da empresa.
  const ppPorLocal = new Map<string, number>()
  const ppEmpresa = new Map<string, number>()
  for (const p of parametros ?? []) {
    if (p.ponto_pedido == null) continue
    if (p.local_id) ppPorLocal.set(`${p.epi_id}:${p.local_id}`, Number(p.ponto_pedido))
    else ppEmpresa.set(p.epi_id, Number(p.ponto_pedido))
  }
  function pontoPedidoDe(epiId: string, localId: string): number | null {
    return ppPorLocal.get(`${epiId}:${localId}`) ?? ppEmpresa.get(epiId) ?? null
  }

  const todos = saldos ?? []
  const valorizacao = valorizacaoTotal(todos)
  const total = todos.length
  const inicio = (page - 1) * PER_PAGE
  const pagina = todos.slice(inicio, inicio + PER_PAGE)

  return (
    <div className="container py-8 space-y-6">
      <PageHeader
        icon={<Boxes />}
        title="Estoque de EPIs"
        description="Saldos por local, custo médio e valorização do estoque."
        actions={
          <ExportCsvButton
            data={todos.map((s) => {
              const epi = one<EpiRel>(s.epi)
              const local = one<LocalRel>(s.local)
              return {
                epi: epi?.descricao ?? "",
                ca: epi?.ca ?? "",
                local: local?.nome ?? "",
                quantidade: s.quantidade,
                unidade: epi?.unidade ?? "",
                custo_medio: Number(s.custo_medio ?? 0),
                custo_total: Number(s.custo_total ?? 0),
              }
            })}
            columns={[
              { key: "epi", label: "EPI" },
              { key: "ca", label: "CA" },
              { key: "local", label: "Local" },
              { key: "quantidade", label: "Qtd" },
              { key: "unidade", label: "Unidade" },
              { key: "custo_medio", label: "Custo médio" },
              { key: "custo_total", label: "Custo total" },
            ]}
            filename="estoque-saldos"
          />
        }
      />

      <EstoqueNav atual="saldos" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valorização total do estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{brl.format(valorizacao)}</p>
            <p className="text-xs text-muted-foreground mt-1">{total} item(ns) de saldo{localFiltro ? " neste local" : ""}.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filtrar por local</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant={localFiltro ? "outline" : "default"} size="sm" asChild>
              <Link href="/epis/estoque">Todos</Link>
            </Button>
            {(locais ?? []).map((l) => (
              <Button key={l.id} variant={localFiltro === l.id ? "default" : "outline"} size="sm" asChild>
                <Link href={`/epis/estoque?local=${l.id}`}>{l.nome}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EPI</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Custo médio</TableHead>
                <TableHead className="text-right">Custo total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagina.map((s) => {
                const epi = one<EpiRel>(s.epi)
                const local = one<LocalRel>(s.local)
                const pp = pontoPedidoDe(s.epi_id, s.local_id)
                const ruptura = emRuptura(Number(s.quantidade ?? 0), pp)
                return (
                  <TableRow key={`${s.epi_id}:${s.local_id}`}>
                    <TableCell>
                      <div className="font-medium">{epi?.descricao ?? "—"}</div>
                      {epi?.ca && <div className="text-xs text-muted-foreground font-mono">CA {epi.ca}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{local?.nome ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(s.quantidade ?? 0)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{epi?.unidade ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl.format(Number(s.custo_medio ?? 0))}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl.format(Number(s.custo_total ?? 0))}</TableCell>
                    <TableCell>
                      {ruptura ? <Badge variant="vencido">Ruptura</Badge> : <Badge variant="regular">OK</Badge>}
                    </TableCell>
                  </TableRow>
                )
              })}
              {total === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar os saldos. Recarregue a página.</span>
                    ) : (
                      <span className="text-muted-foreground">Nenhum saldo em estoque{localFiltro ? " neste local" : ""}.</span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            baseHref="/epis/estoque"
            currentPage={page}
            totalItems={total}
            perPage={PER_PAGE}
            currentParams={{ local: localFiltro }}
            label="saldos"
          />
        </CardContent>
      </Card>
    </div>
  )
}

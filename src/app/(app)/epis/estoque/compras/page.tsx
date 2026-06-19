import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination, parsePageParam } from "@/components/pagination"
import { Plus } from "lucide-react"
import { STATUS_COMPRA_LABEL, type StatusCompra } from "@/lib/estoque/tipos"

const PER_PAGE = 25
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

function statusVariant(s: StatusCompra): BadgeProps["variant"] {
  if (s === "confirmada") return "regular"
  if (s === "cancelada") return "vencido"
  return "secondary"
}

type CompraRow = {
  id: string
  nota_fiscal: string | null
  data_compra: string
  valor_total: number | null
  status: StatusCompra
  empresas: { razao_social: string } | { razao_social: string }[] | null
}

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const sp = await searchParams
  const page = parsePageParam(sp.page)
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from("compra")
    .select("id, nota_fiscal, data_compra, valor_total, status, empresas:fornecedor_id(razao_social)", {
      count: "exact",
    })
    .order("data_compra", { ascending: false })
    .range(from, to)

  const compras = (data ?? []) as CompraRow[]
  const fornecedorNome = (c: CompraRow) =>
    (Array.isArray(c.empresas) ? c.empresas[0]?.razao_social : c.empresas?.razao_social) ?? "—"

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras de EPIs</h1>
          <p className="text-muted-foreground">Entradas no estoque por compra com fornecedor e nota fiscal.</p>
        </div>
        <Button asChild>
          <Link href="/epis/estoque/compras/new">
            <Plus className="h-4 w-4" />
            Nova compra
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{count ?? compras.length} compra(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Nota fiscal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/epis/estoque/compras/${c.id}`} className="font-medium hover:underline">
                      {fornecedorNome(c)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{c.nota_fiscal ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(c.data_compra + "T00:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>{STATUS_COMPRA_LABEL[c.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.valor_total != null ? moeda.format(c.valor_total) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {compras.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">
                        Não foi possível carregar as compras. Recarregue a página.
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Nenhuma compra registrada.</span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            baseHref="/epis/estoque/compras"
            currentPage={page}
            totalItems={count ?? 0}
            perPage={PER_PAGE}
            label="compras"
          />
        </CardContent>
      </Card>
    </div>
  )
}

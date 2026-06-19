import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import { STATUS_COMPRA_LABEL, type StatusCompra } from "@/lib/estoque/tipos"
import { CompraAcoes } from "./compra-acoes"

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

function statusVariant(s: StatusCompra): BadgeProps["variant"] {
  if (s === "confirmada") return "regular"
  if (s === "cancelada") return "vencido"
  return "secondary"
}

function fmtData(d: string | null) {
  return d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—"
}

type ItemRow = {
  id: string
  lote: string | null
  fabricacao: string | null
  validade: string | null
  quantidade: number
  custo_unitario: number
  epis: { descricao: string; ca: string } | { descricao: string; ca: string }[] | null
}

export default async function CompraDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: compra } = await supabase
    .from("compra")
    .select("id, nota_fiscal, data_compra, valor_total, status, observacao, empresas:fornecedor_id(razao_social), estoque_local:local_id(nome)")
    .eq("id", id)
    .single()
  if (!compra) notFound()

  const { data: itensData } = await supabase
    .from("compra_item")
    .select("id, lote, fabricacao, validade, quantidade, custo_unitario, epis(descricao, ca)")
    .eq("compra_id", id)

  const itens = (itensData ?? []) as ItemRow[]
  const status = compra.status as StatusCompra
  const forn = compra.empresas as { razao_social: string } | { razao_social: string }[] | null
  const loc = compra.estoque_local as { nome: string } | { nome: string }[] | null
  const fornecedor = (Array.isArray(forn) ? forn[0]?.razao_social : forn?.razao_social) ?? "—"
  const local = (Array.isArray(loc) ? loc[0]?.nome : loc?.nome) ?? "—"
  const epiNome = (it: ItemRow) =>
    Array.isArray(it.epis) ? it.epis[0] : it.epis

  return (
    <div className="container py-8 max-w-5xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/epis/estoque/compras">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Compra
              <Badge variant={statusVariant(status)}>{STATUS_COMPRA_LABEL[status]}</Badge>
            </h1>
            <p className="text-muted-foreground">{fornecedor}</p>
          </div>
          {status === "rascunho" && <CompraAcoes id={compra.id} />}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Dados da compra</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
          <Campo label="Fornecedor" valor={fornecedor} />
          <Campo label="Local de destino" valor={local} />
          <Campo label="Nota fiscal" valor={compra.nota_fiscal ?? "—"} />
          <Campo label="Data da compra" valor={fmtData(compra.data_compra)} />
          <Campo label="Valor total" valor={compra.valor_total != null ? moeda.format(compra.valor_total) : "—"} />
          {compra.observacao && <Campo label="Observação" valor={compra.observacao} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Itens</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EPI</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Fabricação</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Custo unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((it) => {
                const epi = epiNome(it)
                return (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">
                      {epi?.descricao ?? "—"}
                      {epi?.ca && <span className="text-muted-foreground"> — CA {epi.ca}</span>}
                    </TableCell>
                    <TableCell className="text-sm">{it.lote ?? "—"}</TableCell>
                    <TableCell className="text-sm">{fmtData(it.fabricacao)}</TableCell>
                    <TableCell className="text-sm">{fmtData(it.validade)}</TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantidade}</TableCell>
                    <TableCell className="text-right tabular-nums">{moeda.format(it.custo_unitario)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {moeda.format(it.quantidade * it.custo_unitario)}
                    </TableCell>
                  </TableRow>
                )
              })}
              {itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum item.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{valor}</p>
    </div>
  )
}

import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination, parsePageParam } from "@/components/pagination"
import { Plus } from "lucide-react"

const PER_PAGE = 25

type MovRow = {
  id: string
  tipo: string
  quantidade: number
  data: string
  observacao: string | null
  epis: { descricao: string } | { descricao: string }[] | null
  estoque_local: { nome: string } | { nome: string }[] | null
}

function nome<T extends { [k: string]: unknown }>(rel: T | T[] | null, key: keyof T): string {
  const r = Array.isArray(rel) ? rel[0] : rel
  return (r?.[key] as string) ?? "—"
}

export default async function TransferenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const sp = await searchParams
  const page = parsePageParam(sp.page)
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = await createClient()
  // O motor grava 2 movimentações por transferência (saída na origem + entrada
  // no destino). Listamos ambas as pontas, com o local de cada movimento.
  const { data, error, count } = await supabase
    .from("estoque_movimentacao")
    .select("id, tipo, quantidade, data, observacao, epis(descricao), estoque_local:local_id(nome)", {
      count: "exact",
    })
    .eq("origem", "transferencia")
    .order("created_at", { ascending: false })
    .range(from, to)

  const movs = (data ?? []) as MovRow[]

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transferências</h1>
          <p className="text-muted-foreground">Movimentações de EPIs entre locais de estoque.</p>
        </div>
        <Button asChild>
          <Link href="/epis/estoque/transferencias/new">
            <Plus className="h-4 w-4" />
            Nova transferência
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{count ?? movs.length} movimento(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>EPI</TableHead>
                <TableHead>Movimento</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">
                    {new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium">{nome(m.epis, "descricao")}</TableCell>
                  <TableCell>
                    <Badge variant={m.tipo === "entrada" ? "regular" : "secondary"}>
                      {m.tipo === "entrada" ? "Entrada" : "Saída"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{nome(m.estoque_local, "nome")}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.quantidade}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.observacao ?? "—"}</TableCell>
                </TableRow>
              ))}
              {movs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">
                        Não foi possível carregar as transferências. Recarregue a página.
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Nenhuma transferência registrada.</span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            baseHref="/epis/estoque/transferencias"
            currentPage={page}
            totalItems={count ?? 0}
            perPage={PER_PAGE}
            label="movimentos"
          />
        </CardContent>
      </Card>
    </div>
  )
}

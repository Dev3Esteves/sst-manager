import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { MOTIVOS_LABEL } from "@/lib/validations/epi-entrega"
import { Plus, PenLine, HardHat } from "lucide-react"

export default async function EntregasPage() {
  const supabase = await createClient()
  const { data: entregas } = await supabase
    .from("epi_entregas")
    .select("id, data_entrega, quantidade, motivo, assinatura_url, colaboradores(nome_completo), epis(descricao, ca)")
    .order("data_entrega", { ascending: false })
    .limit(200)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entregas de EPI</h1>
          <p className="text-muted-foreground">Histórico de fichas de entrega com assinatura.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/epis"><HardHat className="h-4 w-4" />Catálogo</Link>
          </Button>
          <Button asChild>
            <Link href="/epis/entregas/new"><Plus className="h-4 w-4" />Nova entrega</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{entregas?.length ?? 0} entrega(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>EPI</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Assinatura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entregas?.map((e) => {
                const c = Array.isArray(e.colaboradores) ? e.colaboradores[0] : e.colaboradores
                const epi = Array.isArray(e.epis) ? e.epis[0] : e.epis
                return (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.data_entrega)}</TableCell>
                    <TableCell className="font-medium">{c?.nome_completo ?? "—"}</TableCell>
                    <TableCell>
                      <div>{epi?.descricao ?? "—"}</div>
                      {epi?.ca && <div className="text-xs text-muted-foreground font-mono">CA {epi.ca}</div>}
                    </TableCell>
                    <TableCell>{e.quantidade}</TableCell>
                    <TableCell><Badge variant="outline">{MOTIVOS_LABEL[e.motivo] ?? e.motivo}</Badge></TableCell>
                    <TableCell>
                      {e.assinatura_url ? (
                        <Badge variant="regular"><PenLine className="h-3 w-3 mr-1" />Assinado</Badge>
                      ) : <Badge variant="secondary">—</Badge>}
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!entregas || entregas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Nenhuma entrega registrada.
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

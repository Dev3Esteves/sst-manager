import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { classificarVencimento, urgenciaBadgeVariant, urgenciaLabel, formatDate } from "@/lib/utils/vencimento"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { Plus, Pencil, FileSpreadsheet } from "lucide-react"

export default async function EpisPage() {
  const supabase = await createClient()
  const { data: epis } = await supabase
    .from("epis")
    .select("id, descricao, ca, ca_validade, fabricante, tipo")
    .order("descricao")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EPIs</h1>
          <p className="text-muted-foreground">Catálogo de equipamentos de proteção individual.</p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            data={(epis ?? []).map((e) => ({
              descricao: e.descricao,
              ca: e.ca,
              ca_validade: e.ca_validade ?? "",
              fabricante: e.fabricante ?? "",
              tipo: e.tipo?.replace("_", " ") ?? "",
            }))}
            columns={[
              { key: "descricao", label: "Descrição" },
              { key: "ca", label: "CA" },
              { key: "ca_validade", label: "Validade CA" },
              { key: "fabricante", label: "Fabricante" },
              { key: "tipo", label: "Tipo" },
            ]}
            filename="epis"
          />
          <Button variant="outline" asChild>
            <Link href="/epis/importar"><FileSpreadsheet className="h-4 w-4" />Importar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/epis/entregas">Entregas</Link>
          </Button>
          <Button asChild>
            <Link href="/epis/new"><Plus className="h-4 w-4" />Novo EPI</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{epis?.length ?? 0} EPI(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Validade CA</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status CA</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {epis?.map((e) => {
                const urg = classificarVencimento(e.ca_validade)
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.descricao}</TableCell>
                    <TableCell className="font-mono">{e.ca}</TableCell>
                    <TableCell>{formatDate(e.ca_validade)}</TableCell>
                    <TableCell>{e.fabricante ?? "—"}</TableCell>
                    <TableCell className="capitalize">{e.tipo?.replace("_", " ") ?? "—"}</TableCell>
                    <TableCell>
                      {urg ? <Badge variant={urgenciaBadgeVariant(urg)}>{urgenciaLabel(urg)}</Badge> : <Badge variant="secondary">Sem data</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/epis/${e.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!epis || epis.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum EPI cadastrado.
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

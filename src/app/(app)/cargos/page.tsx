import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { Plus, Pencil, FileSpreadsheet } from "lucide-react"

export default async function CargosPage() {
  const supabase = await createClient()
  const { data: cargos, error } = await supabase
    .from("cargos")
    .select("id, titulo, cbo, grupo_risco, nrs_aplicaveis, empresas(razao_social)")
    .order("titulo")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cargos / Funções</h1>
          <p className="text-muted-foreground">Vinculados a CBO, NRs e grupo de risco.</p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            data={(cargos ?? []).map((c) => {
              const emp = Array.isArray(c.empresas) ? c.empresas[0] : c.empresas
              return {
                titulo: c.titulo,
                cbo: c.cbo ?? "",
                grupo_risco: c.grupo_risco ?? "",
                empresa: emp?.razao_social ?? "",
              }
            })}
            columns={[
              { key: "titulo", label: "Título" },
              { key: "cbo", label: "CBO" },
              { key: "grupo_risco", label: "Grupo de Risco" },
              { key: "empresa", label: "Empresa" },
            ]}
            filename="cargos"
          />
          <Button variant="outline" asChild>
            <Link href="/cargos/importar"><FileSpreadsheet className="h-4 w-4" />Importar</Link>
          </Button>
          <Button asChild>
            <Link href="/cargos/new"><Plus className="h-4 w-4" />Novo cargo</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{cargos?.length ?? 0} cargo(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>CBO</TableHead>
                <TableHead>GR</TableHead>
                <TableHead>NRs</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargos?.map((c) => {
                const emp = Array.isArray(c.empresas) ? c.empresas[0] : c.empresas
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.titulo}</TableCell>
                    <TableCell>{emp?.razao_social ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{c.cbo ?? "—"}</TableCell>
                    <TableCell>{c.grupo_risco ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(c.nrs_aplicaveis as string[] | null)?.map((nr) => (
                          <Badge key={nr} variant="outline" className="text-[10px]">{nr}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild title="Editar" aria-label={`Editar ${c.titulo}`}>
                        <Link href={`/cargos/${c.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!cargos || cargos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">
                        Não foi possível carregar os cargos. Recarregue a página.
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Nenhum cargo cadastrado.</span>
                    )}
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

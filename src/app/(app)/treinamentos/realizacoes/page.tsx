import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { classificarVencimento, urgenciaBadgeVariant, urgenciaLabel, formatDate } from "@/lib/utils/vencimento"
import { Plus, Users, FileArchive, RectangleHorizontal, RectangleVertical } from "lucide-react"

export default async function RealizacoesPage() {
  const supabase = await createClient()
  const { data: realizacoes, error } = await supabase
    .from("treinamentos_realizados")
    .select("id, data_realizacao, data_vencimento, instrutor, entidade, nota_avaliacao, colaboradores(nome_completo), treinamentos(titulo, nr_referencia)")
    .order("data_vencimento", { ascending: true, nullsFirst: false })

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treinamentos realizados</h1>
          <p className="text-muted-foreground">Histórico de capacitações por colaborador.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/treinamentos/realizacoes/lote"><Users className="h-4 w-4" />Aplicar em lote</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/documentos/lote"><FileArchive className="h-4 w-4" />Certificados em lote</Link>
          </Button>
          <Button asChild>
            <Link href="/treinamentos/realizacoes/new"><Plus className="h-4 w-4" />Registrar realização</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{realizacoes?.length ?? 0} realização(ões)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Treinamento</TableHead>
                <TableHead>Realização</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-center">Certificado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {realizacoes?.map((r) => {
                const colab = Array.isArray(r.colaboradores) ? r.colaboradores[0] : r.colaboradores
                const trn = Array.isArray(r.treinamentos) ? r.treinamentos[0] : r.treinamentos
                const urgencia = classificarVencimento(r.data_vencimento)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{colab?.nome_completo ?? "—"}</TableCell>
                    <TableCell>
                      {trn?.titulo ?? "—"}
                      {trn?.nr_referencia && <Badge variant="outline" className="ml-2 text-[10px]">{trn.nr_referencia}</Badge>}
                    </TableCell>
                    <TableCell>{formatDate(r.data_realizacao)}</TableCell>
                    <TableCell>{formatDate(r.data_vencimento)}</TableCell>
                    <TableCell>{r.entidade ?? r.instrutor ?? "—"}</TableCell>
                    <TableCell>{r.nota_avaliacao ?? "—"}</TableCell>
                    <TableCell>
                      {urgencia ? <Badge variant={urgenciaBadgeVariant(urgencia)}>{urgenciaLabel(urgencia)}</Badge> : <Badge variant="secondary">Sem vencimento</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" asChild title="Certificado horizontal (paisagem)">
                          <Link href={`/api/treinamentos/realizacoes/${r.id}/certificado?orientacao=paisagem`} target="_blank">
                            <RectangleHorizontal className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Certificado vertical (retrato)">
                          <Link href={`/api/treinamentos/realizacoes/${r.id}/certificado?orientacao=retrato`} target="_blank">
                            <RectangleVertical className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!realizacoes || realizacoes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {error
                      ? <span className="text-destructive" role="alert">Não foi possível carregar as realizações. Recarregue a página.</span>
                      : "Nenhuma realização registrada."}
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

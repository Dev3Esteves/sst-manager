import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Brain } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aberta: "Aberta",
  encerrada: "Encerrada",
  analisada: "Analisada",
}
function statusVariant(s: string): BadgeProps["variant"] {
  if (s === "aberta") return "regular"
  if (s === "analisada") return "default"
  if (s === "encerrada") return "secondary"
  return "outline"
}

export default async function PsicossocialPage() {
  const supabase = await createClient()
  const { data: campanhas, error } = await supabase
    .from("psi_campanha")
    .select("id, titulo, status, versao_aplicada, data_inicio, pgr(numero_revisao, obras(nome))")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7" /> Riscos Psicossociais
          </h1>
          <p className="text-muted-foreground">
            Avaliação de fatores psicossociais (NR-01) por GHE — integrada ao PGR.
          </p>
        </div>
        <Button asChild>
          <Link href="/psicossocial/new"><Plus className="h-4 w-4" /> Nova campanha</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{campanhas?.length ?? 0} campanha(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Obra / PGR</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campanhas?.map((c) => {
                const pgr = Array.isArray(c.pgr) ? c.pgr[0] : c.pgr
                const obra = pgr ? (Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras) : null
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/psicossocial/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.titulo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {obra?.nome ?? "—"}{pgr ? ` · rev ${pgr.numero_revisao}` : ""}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{c.versao_aplicada}</TableCell>
                    <TableCell className="text-sm">{formatDate(c.data_inicio)}</TableCell>
                    <TableCell><Badge variant={statusVariant(c.status)}>{STATUS_LABEL[c.status] ?? c.status}</Badge></TableCell>
                  </TableRow>
                )
              })}
              {(!campanhas || campanhas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">
                        Não foi possível carregar as campanhas. Recarregue a página.
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Nenhuma campanha ainda. Crie uma sobre um PGR existente.</span>
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

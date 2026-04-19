import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { Plus, ClipboardCheck } from "lucide-react"

function conformidadeVariant(p: number | null): BadgeProps["variant"] {
  if (p === null) return "secondary"
  if (p >= 90) return "regular"
  if (p >= 70) return "alerta"
  if (p >= 50) return "critico"
  return "vencido"
}

export default async function InspecoesPage() {
  const supabase = await createClient()
  const { data: inspecoes } = await supabase
    .from("inspecoes")
    .select("id, local, data_inspecao, percentual_conformidade, status, templates_inspecao(titulo, categoria), colaboradores(nome_completo)")
    .order("data_inspecao", { ascending: false })
    .limit(100)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspeções</h1>
          <p className="text-muted-foreground">Checklists executados em campo.</p>
        </div>
        <Button asChild>
          <Link href="/inspecoes/new"><Plus className="h-4 w-4" />Nova inspeção</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{inspecoes?.length ?? 0} inspeção(ões)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Inspetor</TableHead>
                <TableHead className="text-center">% Conformidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspecoes?.map((i) => {
                const tpl = Array.isArray(i.templates_inspecao) ? i.templates_inspecao[0] : i.templates_inspecao
                const insp = Array.isArray(i.colaboradores) ? i.colaboradores[0] : i.colaboradores
                return (
                  <TableRow key={i.id} className="cursor-pointer">
                    <TableCell>{formatDate(i.data_inspecao)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{tpl?.titulo ?? "—"}</div>
                      {tpl?.categoria && <div className="text-xs text-muted-foreground capitalize">{tpl.categoria}</div>}
                    </TableCell>
                    <TableCell>{i.local}</TableCell>
                    <TableCell>{insp?.nome_completo ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={conformidadeVariant(i.percentual_conformidade)}>
                        {i.percentual_conformidade != null ? `${i.percentual_conformidade}%` : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{i.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!inspecoes || inspecoes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    <ClipboardCheck className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    Nenhuma inspeção registrada ainda.
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

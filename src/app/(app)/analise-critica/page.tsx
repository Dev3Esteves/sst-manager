import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, ClipboardCheck } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"
import { ANALISE_STATUS } from "@/lib/validations/analise-critica"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const

export default async function AnaliseCriticaPage() {
  const r = await checkRole(ROLES)
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Direção.</div>

  const { data: analises, error } = await r.ctx.supabase
    .from("analise_critica")
    .select("id, data_reuniao, periodo, status")
    .order("data_reuniao", { ascending: false })

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ClipboardCheck className="h-7 w-7" /> Análise crítica pela direção</h1>
          <p className="text-muted-foreground">Análises críticas do SGSST (ISO 45001 — 9.3).</p>
        </div>
        <Button asChild><Link href="/analise-critica/nova"><Plus className="h-4 w-4" />Nova análise</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{analises?.length ?? 0} análise(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analises?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{formatDate(a.data_reuniao)}</TableCell>
                  <TableCell>{a.periodo ?? "—"}</TableCell>
                  <TableCell><Badge variant={a.status === "realizada" ? "regular" : "outline"}>{ANALISE_STATUS[a.status] ?? a.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/analise-critica/${a.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!analises || analises.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    <ClipboardCheck className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar as análises críticas. Recarregue a página.</span>
                    ) : (
                      "Nenhuma análise crítica registrada."
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

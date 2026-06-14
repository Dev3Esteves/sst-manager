import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, ClipboardCheck } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"
import { AUDITORIA_STATUS } from "@/lib/validations/auditoria"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const

export default async function AuditoriasPage() {
  const r = await checkRole(ROLES)
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Direção.</div>

  const { data: auditorias, error } = await r.ctx.supabase
    .from("auditoria")
    .select("id, numero_sequencial, titulo, auditor_nome, data_planejada, data_realizacao, status")
    .order("numero_sequencial", { ascending: false })

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ClipboardCheck className="h-7 w-7" /> Auditorias internas</h1>
          <p className="text-muted-foreground">Programa e execução de auditorias do SGSST (ISO 45001 — 9.2).</p>
        </div>
        <Button asChild><Link href="/auditorias/nova"><Plus className="h-4 w-4" />Nova auditoria</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{auditorias?.length ?? 0} auditoria(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Auditor</TableHead>
                <TableHead>Planejada</TableHead>
                <TableHead>Realizada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditorias?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{String(a.numero_sequencial).padStart(4, "0")}</TableCell>
                  <TableCell className="font-medium">{a.titulo}</TableCell>
                  <TableCell>{a.auditor_nome ?? "—"}</TableCell>
                  <TableCell>{a.data_planejada ? formatDate(a.data_planejada) : "—"}</TableCell>
                  <TableCell>{a.data_realizacao ? formatDate(a.data_realizacao) : "—"}</TableCell>
                  <TableCell><Badge variant={a.status === "concluida" ? "regular" : a.status === "em_andamento" ? "alerta" : a.status === "cancelada" ? "secondary" : "outline"}>{AUDITORIA_STATUS[a.status] ?? a.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Abrir"><Link href={`/auditorias/${a.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!auditorias || auditorias.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar as auditorias. Recarregue a página.</span>
                    ) : (
                      <><ClipboardCheck className="mx-auto h-10 w-10 opacity-30 mb-2" />Nenhuma auditoria registrada.</>
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

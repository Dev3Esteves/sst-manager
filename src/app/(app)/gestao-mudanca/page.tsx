import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Replace } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"
import { MUDANCA_TIPOS, MUDANCA_STATUS } from "@/lib/validations/gestao-mudanca"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const

function statusVariant(s: string): BadgeProps["variant"] {
  if (["concluida", "implementada"].includes(s)) return "regular"
  if (["em_analise", "em_monitoramento", "aprovada"].includes(s)) return "alerta"
  if (["rejeitada", "cancelada"].includes(s)) return "secondary"
  return "outline"
}

export default async function GestaoMudancaPage() {
  const r = await checkRole(ROLES)
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Direção.</div>

  const { data: mudancas, error } = await r.ctx.supabase
    .from("gestao_mudanca")
    .select("id, numero_sequencial, titulo, tipo, carater, data_prevista, status")
    .order("numero_sequencial", { ascending: false })

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Replace className="h-7 w-7" /> Gestão de Mudança</h1>
          <p className="text-muted-foreground">Mudanças com avaliação de risco de SST (ISO 45001 — 8.1.3).</p>
        </div>
        <Button asChild><Link href="/gestao-mudanca/nova"><Plus className="h-4 w-4" />Nova mudança</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{mudancas?.length ?? 0} mudança(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Caráter</TableHead>
                <TableHead>Prevista</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mudancas?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{String(m.numero_sequencial).padStart(4, "0")}</TableCell>
                  <TableCell className="font-medium">{m.titulo}</TableCell>
                  <TableCell>{MUDANCA_TIPOS[m.tipo] ?? m.tipo}</TableCell>
                  <TableCell className="capitalize">{m.carater}</TableCell>
                  <TableCell>{m.data_prevista ? formatDate(m.data_prevista) : "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant(m.status)}>{MUDANCA_STATUS[m.status] ?? m.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/gestao-mudanca/${m.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!mudancas || mudancas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar as mudanças. Recarregue a página.</span>
                    ) : (
                      <><Replace className="mx-auto h-10 w-10 opacity-30 mb-2" />Nenhuma mudança registrada.</>
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

import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Target } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"
import { OBJETIVO_STATUS } from "@/lib/validations/objetivo"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const

function statusVariant(s: string): BadgeProps["variant"] {
  if (s === "atingido") return "regular"
  if (s === "em_andamento") return "alerta"
  if (s === "nao_atingido") return "vencido"
  if (s === "cancelado") return "secondary"
  return "outline"
}

export default async function ObjetivosPage() {
  const r = await checkRole(ROLES)
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Direção.</div>

  const { data: objetivos, error } = await r.ctx.supabase
    .from("objetivo_sst")
    .select("id, titulo, indicador, meta, valor_atual, prazo, status")
    .order("created_at", { ascending: false })

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Target className="h-7 w-7" /> Objetivos e metas de SST</h1>
          <p className="text-muted-foreground">Objetivos mensuráveis do SGSST (ISO 45001 — 6.2).</p>
        </div>
        <Button asChild><Link href="/objetivos/novo"><Plus className="h-4 w-4" />Novo objetivo</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{objetivos?.length ?? 0} objetivo(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objetivo</TableHead>
                <TableHead>Indicador / Meta</TableHead>
                <TableHead>Atual</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objetivos?.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.titulo}</TableCell>
                  <TableCell className="text-sm">{o.indicador ?? "—"}{o.meta ? ` · ${o.meta}` : ""}</TableCell>
                  <TableCell>{o.valor_atual ?? "—"}</TableCell>
                  <TableCell>{o.prazo ? formatDate(o.prazo) : "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant(o.status)}>{OBJETIVO_STATUS[o.status] ?? o.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/objetivos/${o.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!objetivos || objetivos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    <Target className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar os objetivos. Recarregue a página.</span>
                    ) : "Nenhum objetivo cadastrado."}
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

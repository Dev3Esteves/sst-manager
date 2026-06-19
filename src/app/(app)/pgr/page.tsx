import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye, AlertTriangle } from "lucide-react"
import { PGR_STATUS_LABEL, type PgrStatus } from "@/lib/validations/pgr"
import { formatDate } from "@/lib/utils/vencimento"

export const metadata = { title: "PGR — Programas de Gerenciamento de Riscos" }

type PgrRow = {
  id: string
  numero_revisao: number
  descricao_revisao: string | null
  data_emissao: string
  data_vencimento: string
  status: PgrStatus
  obras: { nome: string; codigo: string | null; cno: string | null } | { nome: string; codigo: string | null; cno: string | null }[] | null
}

function statusVariant(status: PgrStatus): "default" | "secondary" | "outline" | "alerta" | "vencido" {
  switch (status) {
    case "vigente": return "default"
    case "rascunho": return "outline"
    case "superseded": return "secondary"
    case "vencido": return "vencido"
  }
}

function diasParaVencer(dataVencimento: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVencimento)
  return Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function PgrListPage() {
  const supabase = await createClient()
  const { data: pgrs, error } = await supabase
    .from("pgr")
    .select(`
      id, numero_revisao, descricao_revisao, data_emissao, data_vencimento, status,
      obras!inner(nome, codigo, cno)
    `)
    .order("data_emissao", { ascending: false })

  const rows = (pgrs ?? []) as PgrRow[]
  const vigentes = rows.filter((p) => p.status === "vigente").length
  const proximosVencer = rows.filter((p) => {
    if (p.status !== "vigente") return false
    const dias = diasParaVencer(p.data_vencimento)
    return dias >= 0 && dias <= 60
  }).length

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PGR — Programa de Gerenciamento de Riscos</h1>
          <p className="text-muted-foreground">
            NR-01 + Portaria MTE 1.419/2024 (riscos psicossociais — prazo 25/05/2026).
          </p>
        </div>
        <Button asChild>
          <Link href="/pgr/new">
            <Plus className="h-4 w-4" />
            Novo PGR
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground">PGRs cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vigentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vigentes}</div>
            <p className="text-xs text-muted-foreground">Status = vigente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              {proximosVencer > 0 && <AlertTriangle className="h-3 w-3 text-status-alerta" />}
              Vencendo em ≤ 60 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proximosVencer}</div>
            <p className="text-xs text-muted-foreground">Requer revisão</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PGRs cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead className="w-20">Rev.</TableHead>
                <TableHead className="w-28">Emissão</TableHead>
                <TableHead className="w-28">Vencimento</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const obra = Array.isArray(p.obras) ? p.obras[0] : p.obras
                const dias = diasParaVencer(p.data_vencimento)
                const venceuOuPerto = p.status === "vigente" && dias <= 60
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{obra?.nome ?? "—"}</div>
                      {obra?.codigo && (
                        <div className="text-xs text-muted-foreground">{obra.codigo}</div>
                      )}
                      {p.descricao_revisao && (
                        <div className="text-xs text-muted-foreground italic line-clamp-1 mt-0.5">
                          {p.descricao_revisao}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {String(p.numero_revisao).padStart(2, "0")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(p.data_emissao)}
                    </TableCell>
                    <TableCell className={`text-sm ${venceuOuPerto ? "text-status-alerta font-medium" : ""}`}>
                      {formatDate(p.data_vencimento)}
                      {venceuOuPerto && dias >= 0 && (
                        <div className="text-xs">em {dias}d</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(p.status)} className="text-[10px]">
                        {PGR_STATUS_LABEL[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild aria-label="Ver detalhes do PGR">
                        <Link href={`/pgr/${p.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">
                        Não foi possível carregar os PGRs. Recarregue a página.
                      </span>
                    ) : (
                      <>
                        Nenhum PGR cadastrado. Clique em <strong>Novo PGR</strong> para começar.
                      </>
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

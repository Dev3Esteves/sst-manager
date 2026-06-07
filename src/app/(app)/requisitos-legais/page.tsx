import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Scale } from "lucide-react"
import { REQ_TIPOS } from "@/lib/validations/requisito-legal"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const

function atendeBadge(a: boolean | null) {
  if (a === true) return <Badge variant="regular">Atende</Badge>
  if (a === false) return <Badge variant="vencido">Não atende</Badge>
  return <Badge variant="secondary">Não avaliado</Badge>
}

export default async function RequisitosLegaisPage() {
  const r = await checkRole(ROLES)
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Direção.</div>

  const { data: reqs } = await r.ctx.supabase
    .from("requisito_legal")
    .select("id, tipo, referencia, titulo, atende, ativo")
    .order("referencia")

  const lista = reqs ?? []
  const naoAtende = lista.filter((x) => x.atende === false && x.ativo).length

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Scale className="h-7 w-7" /> Requisitos legais</h1>
          <p className="text-muted-foreground">Requisitos legais e outros aplicáveis, com avaliação de atendimento (ISO 6.1.3 / 9.1.2).</p>
        </div>
        <Button asChild><Link href="/requisitos-legais/novo"><Plus className="h-4 w-4" />Novo requisito</Link></Button>
      </div>

      {naoAtende > 0 && (
        <div className="rounded-md border border-status-vencido bg-status-vencido/10 p-3 text-sm text-status-vencido">
          {naoAtende} requisito(s) ativo(s) avaliado(s) como <strong>não atendido(s)</strong> — trate como não-conformidade.
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">{lista.length} requisito(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="text-center">Atendimento</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((x) => (
                <TableRow key={x.id} className={x.ativo ? "" : "opacity-50"}>
                  <TableCell className="font-medium">{x.referencia}</TableCell>
                  <TableCell>{REQ_TIPOS[x.tipo] ?? x.tipo}</TableCell>
                  <TableCell>{x.titulo ?? "—"}</TableCell>
                  <TableCell className="text-center">{atendeBadge(x.atende)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/requisitos-legais/${x.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              ))}
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    <Scale className="mx-auto h-10 w-10 opacity-30 mb-2" />Nenhum requisito legal cadastrado.
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

import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Siren } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"
import { CENARIOS_EMERGENCIA } from "@/lib/validations/plano-emergencia"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "encarregado_campo"] as const

export default async function PlanoEmergenciaPage() {
  const r = await checkRole(ROLES)
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Campo.</div>

  const { data: planos } = await r.ctx.supabase
    .from("plano_emergencia")
    .select("id, titulo, cenario, ultimo_simulado, proximo_simulado, status, obras(nome)")
    .order("titulo")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Siren className="h-7 w-7" /> Plano de emergência</h1>
          <p className="text-muted-foreground">Preparação e resposta a emergências (ISO 45001 — 8.2).</p>
        </div>
        <Button asChild><Link href="/plano-emergencia/novo"><Plus className="h-4 w-4" />Novo plano</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{planos?.length ?? 0} plano(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cenário</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Último simulado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos?.map((p) => {
                const obra = Array.isArray(p.obras) ? p.obras[0] : p.obras
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.titulo}</TableCell>
                    <TableCell>{CENARIOS_EMERGENCIA[p.cenario] ?? p.cenario}</TableCell>
                    <TableCell>{obra?.nome ?? "—"}</TableCell>
                    <TableCell>{p.ultimo_simulado ? formatDate(p.ultimo_simulado) : "—"}</TableCell>
                    <TableCell><Badge variant={p.status === "ativo" ? "regular" : p.status === "em_revisao" ? "alerta" : "secondary"} className="capitalize">{p.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/plano-emergencia/${p.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!planos || planos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    <Siren className="mx-auto h-10 w-10 opacity-30 mb-2" />Nenhum plano de emergência cadastrado.
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

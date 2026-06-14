import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Stethoscope } from "lucide-react"
import { MEDICO_STATUS_LABEL } from "@/lib/validations/medico"

function statusVariant(s: string): BadgeProps["variant"] {
  switch (s) {
    case "ativo": return "regular"
    case "suspenso": return "alerta"
    case "inativo": return "secondary"
    default: return "outline"
  }
}

export default async function MedicosPage() {
  const r = await checkRole(["admin", "tec_seguranca", "rh_administrativo"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") {
    return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Técnico de Segurança, RH ou Administrador.</div>
  }

  const { data: medicos, error } = await r.ctx.supabase
    .from("medicos")
    .select("id, nome, crm, uf_crm, especialidade, status")
    .order("nome")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Médicos</h1>
          <p className="text-muted-foreground">Médicos responsáveis pelos ASOs (exames ocupacionais).</p>
        </div>
        <Button asChild>
          <Link href="/medicos/new"><Plus className="h-4 w-4" />Cadastrar médico</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{medicos?.length ?? 0} médico(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CRM</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicos?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="font-mono text-sm">{m.crm}{m.uf_crm ? `/${m.uf_crm}` : ""}</TableCell>
                  <TableCell>{m.especialidade ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant(m.status)}>{MEDICO_STATUS_LABEL[m.status] ?? m.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar">
                      <Link href={`/medicos/${m.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!medicos || medicos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar os médicos. Recarregue a página.</span>
                    ) : (
                      <span className="text-muted-foreground">
                        <Stethoscope className="mx-auto h-10 w-10 opacity-30 mb-2" />
                        Nenhum médico cadastrado.
                      </span>
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

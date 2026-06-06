import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Building2 } from "lucide-react"
import { formatCNPJ } from "@/lib/validations/shared"

export default async function ClinicasPage() {
  const r = await checkRole(["admin", "tec_seguranca", "rh_administrativo"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") {
    return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Técnico de Segurança, RH ou Administrador.</div>
  }

  const { data: clinicas } = await r.ctx.supabase
    .from("clinicas")
    .select("id, nome, nome_fantasia, cnpj, municipio, uf, ativo")
    .order("nome")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clínicas</h1>
          <p className="text-muted-foreground">Clínicas e laboratórios de medicina ocupacional.</p>
        </div>
        <Button asChild>
          <Link href="/clinicas/new"><Plus className="h-4 w-4" />Cadastrar clínica</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{clinicas?.length ?? 0} clínica(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Município/UF</TableHead>
                <TableHead className="text-center">Ativa</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinicas?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.nome}</div>
                    {c.nome_fantasia && <div className="text-xs text-muted-foreground">{c.nome_fantasia}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{c.cnpj ? formatCNPJ(c.cnpj) : "—"}</TableCell>
                  <TableCell>{c.municipio ? `${c.municipio}${c.uf ? `/${c.uf}` : ""}` : "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.ativo ? "regular" : "secondary"}>{c.ativo ? "Ativa" : "Inativa"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar">
                      <Link href={`/clinicas/${c.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!clinicas || clinicas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    <Building2 className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    Nenhuma clínica cadastrada.
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

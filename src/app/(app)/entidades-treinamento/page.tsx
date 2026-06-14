import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, School } from "lucide-react"
import { formatCNPJ } from "@/lib/validations/shared"

export default async function EntidadesPage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Administrador.</div>

  const { data: entidades, error } = await r.ctx.supabase
    .from("entidades_treinamento").select("id, nome, nome_fantasia, cnpj, municipio, uf, ativo").order("nome")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entidades de treinamento</h1>
          <p className="text-muted-foreground">Instituições que emitem certificados (Senai, Senac, etc.).</p>
        </div>
        <Button asChild><Link href="/entidades-treinamento/new"><Plus className="h-4 w-4" />Cadastrar entidade</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{entidades?.length ?? 0} entidade(s)</CardTitle></CardHeader>
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
              {entidades?.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.nome}</div>
                    {e.nome_fantasia && <div className="text-xs text-muted-foreground">{e.nome_fantasia}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{e.cnpj ? formatCNPJ(e.cnpj) : "—"}</TableCell>
                  <TableCell>{e.municipio ? `${e.municipio}${e.uf ? `/${e.uf}` : ""}` : "—"}</TableCell>
                  <TableCell className="text-center"><Badge variant={e.ativo ? "regular" : "secondary"}>{e.ativo ? "Ativa" : "Inativa"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/entidades-treinamento/${e.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!entidades || entidades.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  <School className="mx-auto h-10 w-10 opacity-30 mb-2" />
                  {error
                    ? <span className="text-destructive" role="alert">Não foi possível carregar as entidades. Recarregue a página.</span>
                    : "Nenhuma entidade cadastrada."}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

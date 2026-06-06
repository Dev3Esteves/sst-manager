import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, GraduationCap } from "lucide-react"
import { INSTRUTOR_REGISTRO_LABEL } from "@/lib/validations/instrutor"

export default async function InstrutoresPage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Administrador.</div>

  const { data: instrutores } = await r.ctx.supabase
    .from("instrutores").select("id, nome, registro_tipo, registro_numero, formacao, ativo").order("nome")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instrutores</h1>
          <p className="text-muted-foreground">Profissionais que ministram treinamentos.</p>
        </div>
        <Button asChild><Link href="/instrutores/new"><Plus className="h-4 w-4" />Cadastrar instrutor</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{instrutores?.length ?? 0} instrutor(es)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Formação</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instrutores?.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.nome}</TableCell>
                  <TableCell>{i.registro_tipo ? `${INSTRUTOR_REGISTRO_LABEL[i.registro_tipo] ?? i.registro_tipo}${i.registro_numero ? ` ${i.registro_numero}` : ""}` : "—"}</TableCell>
                  <TableCell>{i.formacao ?? "—"}</TableCell>
                  <TableCell className="text-center"><Badge variant={i.ativo ? "regular" : "secondary"}>{i.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/instrutores/${i.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!instrutores || instrutores.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  <GraduationCap className="mx-auto h-10 w-10 opacity-30 mb-2" />Nenhum instrutor cadastrado.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

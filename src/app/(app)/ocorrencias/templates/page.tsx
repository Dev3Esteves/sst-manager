import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, FileText, ArrowLeft } from "lucide-react"
import { OCORRENCIA_TIPOS } from "@/lib/validations/ocorrencia"
import { TemplateAtivoToggle } from "./template-ativo-toggle"

export default async function TemplatesOcorrenciaPage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status === "unauth") {
    return <div className="container py-10 text-center text-muted-foreground">Sessão expirada. Faça login novamente.</div>
  }
  if (r.status === "forbidden") {
    return (
      <div className="container py-10 text-center text-muted-foreground">
        Acesso restrito a Técnico de Segurança, Engenheiro de Segurança ou Administrador.
      </div>
    )
  }

  const { data: templates } = await r.ctx.supabase
    .from("templates_ocorrencia")
    .select("id, tipo, titulo, ativo, is_sistema")
    .order("titulo")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/ocorrencias"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Templates de ocorrência</h1>
          </div>
          <p className="text-muted-foreground">Modelos pré-configurados que agilizam o registro de ocorrências.</p>
        </div>
        <Button asChild>
          <Link href="/ocorrencias/templates/new"><Plus className="h-4 w-4" />Novo template</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{templates?.length ?? 0} template(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.titulo}</TableCell>
                  <TableCell>{OCORRENCIA_TIPOS[t.tipo] ?? t.tipo}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_sistema ? "outline" : "secondary"}>
                      {t.is_sistema ? "Sistema" : "Personalizado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <TemplateAtivoToggle id={t.id} ativo={!!t.ativo} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar">
                      <Link href={`/ocorrencias/templates/${t.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!templates || templates.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    <FileText className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    Nenhum template cadastrado.
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

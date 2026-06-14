import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, ClipboardList, ArrowLeft } from "lucide-react"
import { PERIODICIDADES, type TemplateItem } from "@/lib/validations/inspecao"
import { TemplateAtivoToggle } from "./template-ativo-toggle"

export default async function TemplatesInspecaoPage() {
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

  const { data: templates, error } = await r.ctx.supabase
    .from("templates_inspecao")
    .select("id, titulo, categoria, periodicidade, ativo, itens")
    .order("titulo")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Voltar para inspeções" asChild>
              <Link href="/inspecoes"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Templates de inspeção</h1>
          </div>
          <p className="text-muted-foreground">Checklists reutilizáveis usados ao iniciar uma inspeção.</p>
        </div>
        <Button asChild>
          <Link href="/inspecoes/templates/new"><Plus className="h-4 w-4" />Novo template</Link>
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
                <TableHead>Categoria</TableHead>
                <TableHead>Periodicidade</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((t) => {
                const itens = (t.itens as TemplateItem[]) ?? []
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.titulo}</TableCell>
                    <TableCell className="capitalize">{t.categoria ?? "—"}</TableCell>
                    <TableCell>{t.periodicidade ? (PERIODICIDADES[t.periodicidade] ?? t.periodicidade) : "—"}</TableCell>
                    <TableCell className="text-center">{itens.length}</TableCell>
                    <TableCell className="text-center">
                      <TemplateAtivoToggle id={t.id} ativo={!!t.ativo} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Editar">
                        <Link href={`/inspecoes/templates/${t.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!templates || templates.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar os templates. Recarregue a página.</span>
                    ) : (
                      <>
                        <ClipboardList className="mx-auto h-10 w-10 opacity-30 mb-2" />
                        Nenhum template cadastrado.
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

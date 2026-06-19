import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { EmpresaBadge } from "@/components/empresa-badge"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { Plus, Pencil, HardDrive } from "lucide-react"

export default async function ObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ ativa?: string }>
}) {
  const sp = await searchParams
  const filtroAtivas = sp.ativa !== "0"
  const supabase = await createClient()
  let query = supabase
    .from("obras")
    .select(`
      id, nome, codigo, cidade, uf, data_inicio, data_fim, ativa,
      empresa_id, contratante_id,
      empresa:empresa_id(razao_social),
      contratante:contratante_id(razao_social)
    `)
    .order("ativa", { ascending: false })
    .order("nome")
  if (filtroAtivas) query = query.eq("ativa", true)
  const { data: obras, error } = await query

  return (
    <div className="container py-8 space-y-6">
      <PageHeader
        icon={<HardDrive />}
        title="Obras"
        description="Projetos/obras em andamento. Referência nos documentos oficiais e para alocação de colaboradores em campo."
        actions={
          <>
            <ExportCsvButton
              data={(obras ?? []).map((o) => {
                const empresa = Array.isArray(o.empresa) ? o.empresa[0] : o.empresa
                return {
                  nome: o.nome,
                  codigo: o.codigo ?? "",
                  empresa: empresa?.razao_social ?? "",
                  cidade: o.cidade ?? "",
                  uf: o.uf ?? "",
                  ativa: o.ativa ? "Ativa" : "Encerrada",
                }
              })}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "codigo", label: "Código" },
                { key: "empresa", label: "Empresa" },
                { key: "cidade", label: "Cidade" },
                { key: "uf", label: "UF" },
                { key: "ativa", label: "Status" },
              ]}
              filename="obras"
            />
            <Button variant="outline" asChild>
              <Link href={filtroAtivas ? "/obras?ativa=0" : "/obras"}>
                {filtroAtivas ? "Mostrar todas" : "Só ativas"}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/obras/new"><Plus className="h-4 w-4" />Nova obra</Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{obras?.length ?? 0} obra(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa própria</TableHead>
                <TableHead>Contratante</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obras?.map((o) => {
                const empresa = Array.isArray(o.empresa) ? o.empresa[0] : o.empresa
                const contratante = Array.isArray(o.contratante) ? o.contratante[0] : o.contratante
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.nome}</div>
                      {o.codigo && <div className="text-xs text-muted-foreground font-mono">{o.codigo}</div>}
                    </TableCell>
                    <TableCell>
                      <EmpresaBadge empresaId={o.empresa_id} nome={empresa?.razao_social ?? "—"} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {contratante?.razao_social ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {[o.cidade, o.uf].filter(Boolean).join("/") || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.data_inicio ?? "?"} {o.data_fim ? `→ ${o.data_fim}` : ""}
                    </TableCell>
                    <TableCell>
                      {o.ativa ? <Badge variant="regular">Ativa</Badge> : <Badge variant="secondary">Encerrada</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/obras/${o.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!obras || obras.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">
                        Não foi possível carregar as obras. Recarregue a página.
                      </span>
                    ) : filtroAtivas ? (
                      <span className="text-muted-foreground">Nenhuma obra ativa. Use “Mostrar todas” para ver as encerradas.</span>
                    ) : (
                      <span className="text-muted-foreground">Nenhuma obra cadastrada.</span>
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

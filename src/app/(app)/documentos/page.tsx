import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { FileText, Plus, Download, Package } from "lucide-react"

const TIPO_LABEL: Record<string, string> = {
  apr: "APR — Análise Preliminar de Risco",
  pt: "PT — Permissão de Trabalho",
  autorizacao_nr10: "Autorização NR-10",
  autorizacao_nr35: "Autorização NR-35",
  autorizacao_nr33: "Autorização NR-33",
  os_seguranca: "Ordem de Serviço (NR-1)",
  pet: "PET — Permissão Especial",
  ait: "AIT — Análise Integrada",
  dialogo_seguranca: "DDS — Diálogo de Segurança",
  checklist: "Checklist",
  relatorio_inspecao: "Relatório de Inspeção",
}

function statusVariant(s: string): BadgeProps["variant"] {
  switch (s) {
    case "emitido": case "aprovado": case "executado": return "regular"
    case "rascunho": return "secondary"
    case "vencido": case "cancelado": return "vencido"
    default: return "outline"
  }
}

export default async function DocumentosPage() {
  const supabase = await createClient()
  const { data: docs, error } = await supabase
    .from("documentos_sst")
    .select("id, tipo, titulo, numero_sequencial, data_emissao, data_validade, status, local_trabalho")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos SST</h1>
          <p className="text-muted-foreground">APR, PT, Autorizações NR e demais documentos de campo.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/documentos/lote"><Package className="h-4 w-4" />Gerar em lote</Link>
          </Button>
          <Button asChild>
            <Link href="/documentos/new"><Plus className="h-4 w-4" />Novo documento</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{docs?.length ?? 0} documento(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título / Local</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-sm">{String(d.numero_sequencial).padStart(4, "0")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap">{TIPO_LABEL[d.tipo] ?? d.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{d.titulo ?? "—"}</div>
                    {d.local_trabalho && <div className="text-xs text-muted-foreground">{d.local_trabalho}</div>}
                  </TableCell>
                  <TableCell>{formatDate(d.data_emissao)}</TableCell>
                  <TableCell>{formatDate(d.data_validade)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(d.status)} className="capitalize">{d.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/api/documentos/${d.id}/pdf`} target="_blank" title="Baixar PDF">
                        <Download className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!docs || docs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    <FileText className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar os documentos. Recarregue a página.</span>
                    ) : (
                      "Nenhum documento emitido ainda. Comece criando uma APR ou Autorização NR."
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

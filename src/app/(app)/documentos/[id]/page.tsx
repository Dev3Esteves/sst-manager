import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { Download, ArrowLeft, CheckCircle2 } from "lucide-react"
import { cancelarDocumento } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function DocumentoViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from("documentos_sst")
    .select("*, empresas(razao_social, cnpj)")
    .eq("id", id).single()

  if (!doc) notFound()

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documentos"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/api/documentos/${doc.id}/pdf`} target="_blank">
              <Download className="h-4 w-4" />Baixar PDF
            </Link>
          </Button>
          {doc.status !== "cancelado" && (
            <InativarButton action={cancelarDocumento.bind(null, id)} entityName="documento" />
          )}
        </div>
      </div>

      <Card className="border-status-regular">
        <CardContent className="flex items-start gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-status-regular shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Documento emitido</div>
            <div className="text-sm text-muted-foreground">
              Nº {String(doc.numero_sequencial).padStart(4, "0")} — clique em &quot;Baixar PDF&quot; para gerar.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{doc.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Tipo" value={doc.tipo} />
          <Row label="Número" value={String(doc.numero_sequencial).padStart(4, "0")} />
          <Row label="Status" value={<Badge variant="regular">{doc.status}</Badge>} />
          <Row label="Local" value={doc.local_trabalho ?? "—"} />
          <Row label="Emissão" value={formatDate(doc.data_emissao)} />
          <Row label="Validade" value={formatDate(doc.data_validade)} />
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b pb-2">
      <div className="w-32 text-muted-foreground">{label}</div>
      <div className="flex-1 font-medium">{value}</div>
    </div>
  )
}

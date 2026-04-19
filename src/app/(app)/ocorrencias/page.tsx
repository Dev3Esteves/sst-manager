import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { OCORRENCIA_TIPOS, GRAVIDADE_LABEL } from "@/lib/validations/ocorrencia"
import { Plus, AlertTriangle } from "lucide-react"

function gravidadeVariant(g: string | null): BadgeProps["variant"] {
  switch (g) {
    case "fatal": case "grave": return "vencido"
    case "moderado": return "critico"
    case "leve": return "alerta"
    default: return "secondary"
  }
}

function statusVariant(s: string | null): BadgeProps["variant"] {
  switch (s) {
    case "aberta": return "vencido"
    case "investigando": return "alerta"
    case "concluida": case "encerrada": return "regular"
    default: return "outline"
  }
}

export default async function OcorrenciasPage() {
  const supabase = await createClient()
  const { data: ocorrencias } = await supabase
    .from("ocorrencias")
    .select("id, tipo, numero_sequencial, data_ocorrencia, local, gravidade, status, dias_afastamento, colaboradores(nome_completo)")
    .order("data_ocorrencia", { ascending: false })
    .limit(100)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ocorrências</h1>
          <p className="text-muted-foreground">Acidentes, quase-acidentes, incidentes e desvios.</p>
        </div>
        <Button asChild>
          <Link href="/ocorrencias/new"><Plus className="h-4 w-4" />Registrar ocorrência</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ocorrencias?.length ?? 0} ocorrência(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Envolvido</TableHead>
                <TableHead>Gravidade</TableHead>
                <TableHead>Afastam.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ocorrencias?.map((o) => {
                const c = Array.isArray(o.colaboradores) ? o.colaboradores[0] : o.colaboradores
                return (
                  <TableRow key={o.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs">{String(o.numero_sequencial).padStart(4, "0")}</TableCell>
                    <TableCell>
                      <Link href={`/ocorrencias/${o.id}`} className="hover:underline">
                        {OCORRENCIA_TIPOS[o.tipo] ?? o.tipo}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(o.data_ocorrencia)}</TableCell>
                    <TableCell>{o.local}</TableCell>
                    <TableCell>{c?.nome_completo ?? "—"}</TableCell>
                    <TableCell>
                      {o.gravidade ? <Badge variant={gravidadeVariant(o.gravidade)}>{GRAVIDADE_LABEL[o.gravidade]}</Badge> : "—"}
                    </TableCell>
                    <TableCell>{o.dias_afastamento ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(o.status)} className="capitalize">{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!ocorrencias || ocorrencias.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    <AlertTriangle className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    Nenhuma ocorrência registrada.
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

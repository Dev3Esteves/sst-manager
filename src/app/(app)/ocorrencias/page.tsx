import Link from "next/link"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { OCORRENCIA_TIPOS, GRAVIDADE_LABEL } from "@/lib/validations/ocorrencia"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { ListFilters } from "@/components/shared/list-filters"
import { getAuthWithRole } from "@/lib/auth/guards"
import { Plus, AlertTriangle, Settings2 } from "lucide-react"

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

export default async function OcorrenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; gravidade?: string; status?: string; de?: string; ate?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  let query = supabase
    .from("ocorrencias")
    .select("id, tipo, numero_sequencial, data_ocorrencia, local, gravidade, status, dias_afastamento, colaboradores(nome_completo)")
    .order("data_ocorrencia", { ascending: false })
    .limit(100)

  if (sp.tipo) query = query.eq("tipo", sp.tipo)
  if (sp.gravidade) query = query.eq("gravidade", sp.gravidade)
  if (sp.status) query = query.eq("status", sp.status)
  if (sp.de) query = query.gte("data_ocorrencia", sp.de)
  if (sp.ate) query = query.lte("data_ocorrencia", sp.ate)

  const { data: ocorrencias } = await query
  const podeGerenciarTemplates = await getAuthWithRole(["admin", "tec_seguranca", "engenheiro_seg"])

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ocorrências</h1>
          <p className="text-muted-foreground">Acidentes, quase-acidentes, incidentes e desvios.</p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            data={(ocorrencias ?? []).map((o) => {
              const c = Array.isArray(o.colaboradores) ? o.colaboradores[0] : o.colaboradores
              return {
                tipo: OCORRENCIA_TIPOS[o.tipo] ?? o.tipo,
                data_ocorrencia: o.data_ocorrencia ?? "",
                local: o.local ?? "",
                envolvido: c?.nome_completo ?? "",
                gravidade: o.gravidade ? (GRAVIDADE_LABEL[o.gravidade] ?? o.gravidade) : "",
                status: o.status ?? "",
              }
            })}
            columns={[
              { key: "tipo", label: "Tipo" },
              { key: "data_ocorrencia", label: "Data Ocorrência" },
              { key: "local", label: "Local" },
              { key: "envolvido", label: "Envolvido" },
              { key: "gravidade", label: "Gravidade" },
              { key: "status", label: "Status" },
            ]}
            filename="ocorrencias"
          />
          {podeGerenciarTemplates && (
            <Button variant="outline" asChild>
              <Link href="/ocorrencias/templates"><Settings2 className="h-4 w-4" />Templates</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/ocorrencias/new"><Plus className="h-4 w-4" />Registrar ocorrência</Link>
          </Button>
        </div>
      </div>

      <Suspense>
        <ListFilters filters={[
          { key: "tipo", label: "Tipo", type: "select", options: Object.entries(OCORRENCIA_TIPOS).map(([v, l]) => ({ value: v, label: l })) },
          { key: "gravidade", label: "Gravidade", type: "select", options: [
            { value: "leve", label: "Leve" },
            { value: "moderado", label: "Moderado" },
            { value: "grave", label: "Grave" },
            { value: "fatal", label: "Fatal" },
          ]},
          { key: "status", label: "Status", type: "select", options: [
            { value: "aberta", label: "Aberta" },
            { value: "investigando", label: "Investigando" },
            { value: "concluida", label: "Concluída" },
            { value: "encerrada", label: "Encerrada" },
          ]},
          { key: "de", label: "De", type: "date" },
          { key: "ate", label: "Até", type: "date" },
        ]} />
      </Suspense>

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

import Link from "next/link"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { classificarVencimento, urgenciaBadgeVariant, urgenciaLabel, formatDate } from "@/lib/utils/vencimento"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { ListFilters } from "@/components/shared/list-filters"
import { Plus, ScanLine, FileSpreadsheet, Pencil } from "lucide-react"

const TIPO_LABEL: Record<string, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  retorno_trabalho: "Retorno",
  mudanca_funcao: "Mudança de função",
  demissional: "Demissional",
  complementar: "Complementar",
}

export default async function ExamesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; resultado?: string; de?: string; ate?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  let query = supabase
    .from("exames_medicos")
    .select("id, tipo, subtipo, data_realizacao, data_vencimento, resultado, numero_aso, colaboradores(nome_completo, cpf)")
    .order("data_vencimento", { ascending: true })

  if (sp.tipo) query = query.eq("tipo", sp.tipo)
  if (sp.resultado) query = query.eq("resultado", sp.resultado)
  if (sp.de) query = query.gte("data_vencimento", sp.de)
  if (sp.ate) query = query.lte("data_vencimento", sp.ate)

  const { data: exames, error } = await query
  const temFiltros = !!(sp.tipo || sp.resultado || sp.de || sp.ate)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exames médicos</h1>
          <p className="text-muted-foreground">PCMSO — controle de ASOs e vencimentos.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportCsvButton
            data={(exames ?? []).map((e) => {
              const colab = Array.isArray(e.colaboradores) ? e.colaboradores[0] : e.colaboradores
              const urgencia = classificarVencimento(e.data_vencimento)
              return {
                colaborador: colab?.nome_completo ?? "",
                tipo: TIPO_LABEL[e.tipo] ?? e.tipo,
                data_realizacao: e.data_realizacao ?? "",
                data_vencimento: e.data_vencimento ?? "",
                resultado: e.resultado === "apto_restricao" ? "Apto c/ restrição" : e.resultado === "apto" ? "Apto" : e.resultado === "inapto" ? "Inapto" : "",
                status: urgenciaLabel(urgencia),
              }
            })}
            columns={[
              { key: "colaborador", label: "Colaborador" },
              { key: "tipo", label: "Tipo" },
              { key: "data_realizacao", label: "Realização" },
              { key: "data_vencimento", label: "Vencimento" },
              { key: "resultado", label: "Resultado" },
              { key: "status", label: "Status" },
            ]}
            filename="exames-medicos"
          />
          <Button variant="outline" asChild>
            <Link href="/exames/importar">
              <FileSpreadsheet className="h-4 w-4" />
              Importar
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/exames/ocr">
              <ScanLine className="h-4 w-4" />
              Escanear ASO
            </Link>
          </Button>
          <Button asChild>
            <Link href="/exames/new">
              <Plus className="h-4 w-4" />
              Registrar exame
            </Link>
          </Button>
        </div>
      </div>

      <Suspense>
        <ListFilters filters={[
          { key: "tipo", label: "Tipo", type: "select", options: Object.entries(TIPO_LABEL).map(([v, l]) => ({ value: v, label: l })) },
          { key: "resultado", label: "Resultado", type: "select", options: [
            { value: "apto", label: "Apto" },
            { value: "apto_restricao", label: "Apto c/ restrição" },
            { value: "inapto", label: "Inapto" },
          ]},
          { key: "de", label: "Vencimento de", type: "date" },
          { key: "ate", label: "Vencimento até", type: "date" },
        ]} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{exames?.length ?? 0} exame(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Realização</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exames?.map((e) => {
                const colab = Array.isArray(e.colaboradores) ? e.colaboradores[0] : e.colaboradores
                const urgencia = classificarVencimento(e.data_vencimento)
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium">{colab?.nome_completo ?? "—"}</div>
                      {e.numero_aso && <div className="text-xs text-muted-foreground">ASO {e.numero_aso}</div>}
                    </TableCell>
                    <TableCell>
                      <div>{TIPO_LABEL[e.tipo] ?? e.tipo}</div>
                      {e.subtipo && <div className="text-xs text-muted-foreground">{e.subtipo}</div>}
                    </TableCell>
                    <TableCell>{formatDate(e.data_realizacao)}</TableCell>
                    <TableCell>{formatDate(e.data_vencimento)}</TableCell>
                    <TableCell>
                      {e.resultado ? (
                        <Badge variant={e.resultado === "apto" ? "regular" : e.resultado === "inapto" ? "vencido" : "alerta"}>
                          {e.resultado === "apto_restricao" ? "Apto c/ restrição" : e.resultado === "apto" ? "Apto" : "Inapto"}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={urgenciaBadgeVariant(urgencia)}>{urgenciaLabel(urgencia)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild aria-label="Editar exame">
                        <Link href={`/exames/${e.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!exames || exames.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar os exames. Recarregue a página.</span>
                    ) : temFiltros ? (
                      <span className="text-muted-foreground">Nenhum exame encontrado para os filtros aplicados.</span>
                    ) : (
                      <span className="text-muted-foreground">Nenhum exame registrado.</span>
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

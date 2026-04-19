import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { classificarVencimento, urgenciaBadgeVariant, urgenciaLabel, formatDate } from "@/lib/utils/vencimento"
import { Plus, ScanLine, FileSpreadsheet } from "lucide-react"

const TIPO_LABEL: Record<string, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  retorno_trabalho: "Retorno",
  mudanca_funcao: "Mudança de função",
  demissional: "Demissional",
  complementar: "Complementar",
}

export default async function ExamesPage() {
  const supabase = await createClient()
  const { data: exames } = await supabase
    .from("exames_medicos")
    .select("id, tipo, subtipo, data_realizacao, data_vencimento, resultado, numero_aso, colaboradores(nome_completo, cpf)")
    .order("data_vencimento", { ascending: true })

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exames médicos</h1>
          <p className="text-muted-foreground">PCMSO — controle de ASOs e vencimentos.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
                  </TableRow>
                )
              })}
              {(!exames || exames.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum exame registrado.
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

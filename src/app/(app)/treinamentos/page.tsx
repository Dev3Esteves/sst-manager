import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { Plus, Pencil, ListChecks, FileSpreadsheet, Grid3x3 } from "lucide-react"

const TIPO_LABEL: Record<string, string> = {
  obrigatorio: "Obrigatório",
  reciclagem: "Reciclagem",
  complementar: "Complementar",
  integracao: "Integração",
}

export default async function TreinamentosPage() {
  const supabase = await createClient()
  const { data: treinamentos } = await supabase
    .from("treinamentos")
    .select("id, titulo, nr_referencia, carga_horaria_horas, validade_meses, tipo, modalidade")
    .order("titulo")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treinamentos</h1>
          <p className="text-muted-foreground">Catálogo de treinamentos e capacitações.</p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            data={(treinamentos ?? []).map((t) => ({
              titulo: t.titulo,
              nr_referencia: t.nr_referencia ?? "",
              carga_horaria: `${t.carga_horaria_horas}h`,
              tipo: TIPO_LABEL[t.tipo] ?? t.tipo,
              modalidade: t.modalidade,
            }))}
            columns={[
              { key: "titulo", label: "Título" },
              { key: "nr_referencia", label: "NR Referência" },
              { key: "carga_horaria", label: "Carga Horária" },
              { key: "tipo", label: "Tipo" },
              { key: "modalidade", label: "Modalidade" },
            ]}
            filename="treinamentos"
          />
          <Button variant="outline" asChild>
            <Link href="/treinamentos/importar"><FileSpreadsheet className="h-4 w-4" />Importar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/treinamentos/matriz"><Grid3x3 className="h-4 w-4" />Matriz por cargo</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/treinamentos/realizacoes"><ListChecks className="h-4 w-4" />Realizações</Link>
          </Button>
          <Button asChild>
            <Link href="/treinamentos/new"><Plus className="h-4 w-4" />Novo treinamento</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{treinamentos?.length ?? 0} treinamento(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>NR</TableHead>
                <TableHead>CH</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treinamentos?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.titulo}</TableCell>
                  <TableCell>
                    {t.nr_referencia ? <Badge variant="outline">{t.nr_referencia}</Badge> : "—"}
                  </TableCell>
                  <TableCell>{t.carga_horaria_horas}h</TableCell>
                  <TableCell>{t.validade_meses ? `${t.validade_meses} meses` : "Sem vencimento"}</TableCell>
                  <TableCell>{TIPO_LABEL[t.tipo] ?? t.tipo}</TableCell>
                  <TableCell className="capitalize">{t.modalidade}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/treinamentos/${t.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!treinamentos || treinamentos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum treinamento cadastrado.
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

import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, urgenciaLabel, urgenciaBadgeVariant, type Urgencia } from "@/lib/utils/vencimento"

const CATEGORIA_LABEL: Record<string, string> = {
  exame_medico: "Exame médico",
  treinamento: "Treinamento",
  epi_ca: "CA de EPI",
}

export default async function VencimentosPage() {
  const supabase = await createClient()
  const { data: vencs, error } = await supabase
    .from("vw_vencimentos")
    .select("*")
    .order("dias_restantes", { ascending: true })
    .limit(500)

  const grupos = {
    vencido: vencs?.filter(v => v.urgencia === "vencido") ?? [],
    critico: vencs?.filter(v => v.urgencia === "critico") ?? [],
    alerta: vencs?.filter(v => v.urgencia === "alerta") ?? [],
    regular: vencs?.filter(v => v.urgencia === "regular") ?? [],
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vencimentos</h1>
        <p className="text-muted-foreground">Exames, treinamentos e CAs de EPI — classificação semáforo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Vencidos" count={grupos.vencido.length} variant="vencido" />
        <SummaryCard label="Críticos (≤30d)" count={grupos.critico.length} variant="critico" />
        <SummaryCard label="Alerta (≤60d)" count={grupos.alerta.length} variant="alerta" />
        <SummaryCard label="Em dia" count={grupos.regular.length} variant="regular" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos 500 itens — ordenado por dias restantes</CardTitle>
          <CardDescription>Itens em vermelho/laranja precisam de ação imediata.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Dias restantes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vencs?.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground">
                    {CATEGORIA_LABEL[v.categoria] ?? v.categoria}
                  </TableCell>
                  <TableCell>{v.item}</TableCell>
                  <TableCell>{v.colaborador ?? "—"}</TableCell>
                  <TableCell>{formatDate(v.data_vencimento)}</TableCell>
                  <TableCell className={v.dias_restantes < 0 ? "text-status-vencido font-medium" : ""}>
                    {v.dias_restantes < 0
                      ? `${Math.abs(v.dias_restantes)} dias atrás`
                      : `${v.dias_restantes} dias`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={urgenciaBadgeVariant(v.urgencia as Urgencia)}>
                      {urgenciaLabel(v.urgencia as Urgencia)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!vencs || vencs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar os vencimentos. Recarregue a página.</span>
                    ) : "Nenhum vencimento cadastrado ainda."}
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

function SummaryCard({ label, count, variant }: { label: string; count: number; variant: Urgencia }) {
  const borderClass = {
    vencido: "border-status-vencido",
    critico: "border-status-critico",
    alerta: "border-status-alerta",
    regular: "border-status-regular",
  }[variant]
  return (
    <Card className={count > 0 ? borderClass : ""}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold">{count}</span>
          <Badge variant={variant}>{urgenciaLabel(variant)}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

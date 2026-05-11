import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCNPJ } from "@/lib/validations/shared"
import { TIPO_EMPRESA_LABEL } from "@/lib/validations/empresa"
import { EmpresaBadge } from "@/components/empresa-badge"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { Plus, Pencil, Building2, Handshake, Wrench, ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"

type TabKey = "todas" | "donas" | "contratantes" | "prestadoras"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; descricao: string }[] = [
  { key: "todas", label: "Todas", icon: ListFilter, descricao: "Todas as empresas cadastradas." },
  { key: "donas", label: "Donas do sistema", icon: Building2, descricao: "Empresas que hospedam seus próprios dados (multi-tenant)." },
  { key: "contratantes", label: "Contratantes", icon: Handshake, descricao: "Clientes onde as donas executam obras." },
  { key: "prestadoras", label: "Prestadoras", icon: Wrench, descricao: "Empresas que prestam serviço para as donas." },
]

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp = await searchParams
  const tab: TabKey = (TABS.find((t) => t.key === sp.tab)?.key) ?? "todas"
  const tabInfo = TABS.find((t) => t.key === tab)!

  const supabase = await createClient()
  let query = supabase
    .from("empresas")
    .select("id, razao_social, nome_fantasia, cnpj, tipo, ativo, dona_sistema, empresa_mae_id")
    .order("dona_sistema", { ascending: false })
    .order("razao_social")

  if (tab === "donas") query = query.eq("dona_sistema", true)
  else if (tab === "contratantes") query = query.eq("tipo", "contratante")
  else if (tab === "prestadoras") query = query.eq("tipo", "terceira")

  const { data: empresas } = await query

  // Mapa de mães para exibir o nome da dona ao lado das prestadoras
  const maeIds = Array.from(
    new Set((empresas ?? []).map((e) => e.empresa_mae_id).filter(Boolean) as string[]),
  )
  let nomesMae: Record<string, string> = {}
  if (maeIds.length > 0) {
    const { data: maes } = await supabase
      .from("empresas")
      .select("id, razao_social")
      .in("id", maeIds)
    nomesMae = Object.fromEntries((maes ?? []).map((m) => [m.id, m.razao_social]))
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">Donas do sistema, contratantes e prestadoras.</p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            data={(empresas ?? []).map((e) => ({
              razao_social: e.razao_social,
              cnpj: formatCNPJ(e.cnpj),
              tipo: e.dona_sistema ? "Dona do sistema" : (TIPO_EMPRESA_LABEL[e.tipo ?? ""] ?? "—"),
              ativo: e.ativo ? "Ativa" : "Inativa",
            }))}
            columns={[
              { key: "razao_social", label: "Razão Social" },
              { key: "cnpj", label: "CNPJ" },
              { key: "tipo", label: "Tipo" },
              { key: "ativo", label: "Status" },
            ]}
            filename="empresas"
          />
          <Button asChild>
            <Link href="/empresas/new">
              <Plus className="h-4 w-4" />
              Nova empresa
            </Link>
          </Button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filtro por tipo de empresa"
        className="flex gap-2 border-b overflow-x-auto no-scrollbar"
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.key === tab
          return (
            <Link
              key={t.key}
              href={t.key === "todas" ? "/empresas" : `/empresas?tab=${t.key}`}
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {empresas?.length ?? 0} empresa(s) — {tabInfo.label}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{tabInfo.descricao}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas?.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <EmpresaBadge empresaId={e.id} compact />
                      <div>
                        <div className="font-medium">{e.razao_social}</div>
                        {e.nome_fantasia && (
                          <div className="text-xs text-muted-foreground">{e.nome_fantasia}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatCNPJ(e.cnpj)}</TableCell>
                  <TableCell>
                    <Badge variant={e.dona_sistema ? "default" : "outline"}>
                      {e.dona_sistema ? "Dona do sistema" : TIPO_EMPRESA_LABEL[e.tipo ?? ""] ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.empresa_mae_id ? (
                      <span>↳ {nomesMae[e.empresa_mae_id] ?? "..."}</span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {e.ativo ? (
                      <Badge variant="regular">Ativa</Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/empresas/${e.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!empresas || empresas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma empresa nesta aba.
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

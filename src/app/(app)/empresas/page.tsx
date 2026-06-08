import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCNPJ } from "@/lib/validations/shared"
import { PAPEL_LABEL } from "@/lib/validations/empresa"
import { EmpresaBadge } from "@/components/empresa-badge"
import { ExportCsvButton } from "@/components/shared/export-csv-button"
import { Plus, Pencil, Building2, Handshake, Wrench, ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"

type TabKey = "todas" | "donas" | "contratantes" | "prestadoras"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; descricao: string }[] = [
  { key: "todas", label: "Todas", icon: ListFilter, descricao: "Todas as empresas cadastradas." },
  { key: "donas", label: "Donas do sistema", icon: Building2, descricao: "Empresas que hospedam seus próprios dados (multi-tenant)." },
  { key: "contratantes", label: "Clientes", icon: Handshake, descricao: "Empresas com o papel de cliente/contratante." },
  { key: "prestadoras", label: "Prestadoras", icon: Wrench, descricao: "Empresas com o papel de prestadora." },
]

type EmpresaRow = {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  ativo: boolean
  dona_sistema: boolean | null
  empresa_mae_id: string | null
  empresa_papeis: { papel: string }[] | null
}

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp = await searchParams
  const tab: TabKey = (TABS.find((t) => t.key === sp.tab)?.key) ?? "todas"
  const tabInfo = TABS.find((t) => t.key === tab)!

  const supabase = await createClient()
  const { data } = await supabase
    .from("empresas")
    .select("id, razao_social, nome_fantasia, cnpj, ativo, dona_sistema, empresa_mae_id, empresa_papeis(papel)")
    .order("dona_sistema", { ascending: false })
    .order("razao_social")

  const todas = (data ?? []) as EmpresaRow[]
  const papeisDe = (e: EmpresaRow) => (e.empresa_papeis ?? []).map((p) => p.papel)

  const empresas = todas.filter((e) => {
    if (tab === "donas") return !!e.dona_sistema
    if (tab === "contratantes") return papeisDe(e).includes("cliente")
    if (tab === "prestadoras") return papeisDe(e).includes("prestadora")
    return true
  })

  // Mapa de mães para exibir o nome da dona ao lado das vinculadas.
  const maeIds = Array.from(new Set(empresas.map((e) => e.empresa_mae_id).filter(Boolean) as string[]))
  let nomesMae: Record<string, string> = {}
  if (maeIds.length > 0) {
    const { data: maes } = await supabase.from("empresas").select("id, razao_social").in("id", maeIds)
    nomesMae = Object.fromEntries((maes ?? []).map((m) => [m.id, m.razao_social]))
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">Parceiros de negócio: donas, clientes e prestadoras.</p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            data={empresas.map((e) => ({
              razao_social: e.razao_social,
              cnpj: formatCNPJ(e.cnpj),
              papeis: papeisDe(e).map((p) => PAPEL_LABEL[p as keyof typeof PAPEL_LABEL] ?? p).join(", ") || "—",
              ativo: e.ativo ? "Ativa" : "Inativa",
            }))}
            columns={[
              { key: "razao_social", label: "Razão Social" },
              { key: "cnpj", label: "CNPJ" },
              { key: "papeis", label: "Papéis" },
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

      <div role="tablist" aria-label="Filtro por papel" className="flex gap-2 border-b overflow-x-auto no-scrollbar">
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
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
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
            {empresas.length} empresa(s) — {tabInfo.label}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{tabInfo.descricao}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((e) => (
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
                    <div className="flex flex-wrap gap-1">
                      {e.dona_sistema && <Badge variant="default">Dona do sistema</Badge>}
                      {papeisDe(e)
                        .filter((p) => !(p === "dona" && e.dona_sistema))
                        .map((p) => (
                          <Badge key={p} variant="outline">
                            {PAPEL_LABEL[p as keyof typeof PAPEL_LABEL] ?? p}
                          </Badge>
                        ))}
                      {papeisDe(e).length === 0 && !e.dona_sistema && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.empresa_mae_id ? <span>↳ {nomesMae[e.empresa_mae_id] ?? "..."}</span> : "—"}
                  </TableCell>
                  <TableCell>
                    {e.ativo ? <Badge variant="regular">Ativa</Badge> : <Badge variant="secondary">Inativa</Badge>}
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
              {empresas.length === 0 && (
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

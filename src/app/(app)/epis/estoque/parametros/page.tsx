import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { SlidersHorizontal, Pencil } from "lucide-react"
import { ParametroForm, type ParametroExistente } from "./parametro-form"
import { ExcluirParametroButton } from "./excluir-parametro-button"
import { EstoqueNav } from "../estoque-nav"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const

type EpiRel = { descricao: string; ca: string | null }
type LocalRel = { nome: string }

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export default async function ParametrosPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const role = await checkRole(ROLES)
  if (role.status !== "ok") {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground" role="alert">
            {role.status === "unauth"
              ? "Faça login para acessar os parâmetros de estoque."
              : "Acesso restrito a administradores e técnicos/engenheiros de segurança."}
          </CardContent>
        </Card>
      </div>
    )
  }

  const sp = await searchParams
  const editId = sp.edit || undefined
  const supabase = await createClient()

  const [{ data: epis }, { data: locais }, { data: parametros, error }] = await Promise.all([
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
    supabase.from("estoque_local").select("id, nome").eq("ativo", true).order("nome"),
    supabase
      .from("estoque_parametro")
      .select(`
        id, epi_id, local_id, estoque_minimo, estoque_maximo, estoque_seguranca,
        lead_time_dias, ponto_pedido, consumo_medio, curva_abc,
        epi:epi_id(descricao, ca),
        local:local_id(nome)
      `),
  ])

  const lista = parametros ?? []
  const editando = editId ? lista.find((p) => p.id === editId) : undefined
  const inicial: ParametroExistente | undefined = editando
    ? {
        epi_id: editando.epi_id,
        local_id: editando.local_id,
        estoque_minimo: Number(editando.estoque_minimo ?? 0),
        estoque_maximo: editando.estoque_maximo != null ? Number(editando.estoque_maximo) : null,
        estoque_seguranca: Number(editando.estoque_seguranca ?? 0),
        lead_time_dias: Number(editando.lead_time_dias ?? 0),
        consumo_medio: editando.consumo_medio != null ? Number(editando.consumo_medio) : null,
      }
    : undefined

  return (
    <div className="container py-8 space-y-6">
      <PageHeader
        icon={<SlidersHorizontal />}
        title="Parâmetros de estoque"
        description="Defina mínimo, máximo, segurança e lead time por EPI (e opcionalmente por local)."
      />

      <EstoqueNav atual="parametros" />

      <ParametroForm key={editId ?? "novo"} epis={epis ?? []} locais={locais ?? []} inicial={inicial} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lista.length} parâmetro(s) cadastrado(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EPI</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Máximo</TableHead>
                <TableHead className="text-right">Segurança</TableHead>
                <TableHead className="text-right">Lead time</TableHead>
                <TableHead className="text-right">Ponto pedido</TableHead>
                <TableHead>Curva</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((p) => {
                const epi = one<EpiRel>(p.epi)
                const local = one<LocalRel>(p.local)
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{epi?.descricao ?? "—"}</div>
                      {epi?.ca && <div className="text-xs text-muted-foreground font-mono">CA {epi.ca}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{local?.nome ?? <span className="text-muted-foreground">Todos (padrão)</span>}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(p.estoque_minimo ?? 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.estoque_maximo != null ? Number(p.estoque_maximo) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(p.estoque_seguranca ?? 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(p.lead_time_dias ?? 0)} d</TableCell>
                    <TableCell className="text-right tabular-nums">{p.ponto_pedido != null ? Number(p.ponto_pedido).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"}</TableCell>
                    <TableCell>{p.curva_abc ? <Badge variant="outline">{p.curva_abc}</Badge> : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" asChild aria-label={`Editar parâmetro de ${epi?.descricao ?? "EPI"}`}>
                          <Link href={`/epis/estoque/parametros?edit=${p.id}`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <ExcluirParametroButton id={p.id} epiNome={epi?.descricao ?? "EPI"} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar os parâmetros. Recarregue a página.</span>
                    ) : (
                      <span className="text-muted-foreground">Nenhum parâmetro cadastrado.</span>
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

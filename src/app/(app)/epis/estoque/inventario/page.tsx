import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { ClipboardList } from "lucide-react"
import { InventarioForm, type ItemSaldo } from "./inventario-form"
import { EstoqueNav } from "../estoque-nav"

const ROLES = ["admin", "tec_seguranca", "engenheiro_seg"] as const

type EpiRow = { id: string; descricao: string; ca: string | null; unidade: string | null }
type SaldoRow = { epi_id: string; quantidade: number }

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ local?: string }>
}) {
  const role = await checkRole(ROLES)
  if (role.status !== "ok") {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground" role="alert">
            {role.status === "unauth"
              ? "Faça login para acessar o inventário."
              : "Acesso restrito a administradores e técnicos/engenheiros de segurança."}
          </CardContent>
        </Card>
      </div>
    )
  }

  const sp = await searchParams
  const localId = sp.local && sp.local !== "" ? sp.local : undefined
  const supabase = await createClient()

  const { data: locais } = await supabase
    .from("estoque_local")
    .select("id, nome, tipo")
    .eq("ativo", true)
    .order("nome")

  // Quando um local está selecionado, monta a lista de EPIs com saldo esperado.
  let itens: ItemSaldo[] = []
  if (localId) {
    const [{ data: epis }, { data: saldos }] = await Promise.all([
      supabase.from("epis").select("id, descricao, ca, unidade").order("descricao"),
      supabase.from("estoque_saldo").select("epi_id, quantidade").eq("local_id", localId),
    ])
    const saldoPorEpi = new Map<string, number>()
    for (const s of (saldos ?? []) as SaldoRow[]) {
      saldoPorEpi.set(s.epi_id, Number(s.quantidade ?? 0))
    }
    itens = ((epis ?? []) as EpiRow[]).map((e) => ({
      epi_id: e.id,
      descricao: e.descricao,
      ca: e.ca,
      unidade: e.unidade,
      saldo_esperado: saldoPorEpi.get(e.id) ?? 0,
    }))
  }

  const localAtual = (locais ?? []).find((l) => l.id === localId)

  return (
    <div className="container py-8 space-y-6">
      <PageHeader
        icon={<ClipboardList />}
        title="Inventário"
        description="Contagem física por local. Divergências geram ajustes de entrada/saída no kardex."
      />

      <EstoqueNav atual="inventario" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Selecione o local para contagem</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(locais ?? []).map((l) => (
            <Button key={l.id} variant={localId === l.id ? "default" : "outline"} size="sm" asChild>
              <Link href={`/epis/estoque/inventario?local=${l.id}`}>{l.nome}</Link>
            </Button>
          ))}
          {(locais ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum local de estoque cadastrado.</p>
          )}
        </CardContent>
      </Card>

      {localId && localAtual ? (
        <InventarioForm key={localId} localId={localId} itens={itens} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Escolha um local acima para iniciar a contagem.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

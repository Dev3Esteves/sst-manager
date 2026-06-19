import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { MapPin, ArrowLeft } from "lucide-react"
import { criarLocal, atualizarLocal, inativarLocal } from "./actions"
import { LocaisClient } from "./locais-client"

type ObraRel = { nome: string }

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export default async function EstoqueLocaisPage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Administrador.</div>

  const [{ data: locais }, { data: obras }] = await Promise.all([
    r.ctx.supabase
      .from("estoque_local")
      .select("id, nome, tipo, obra_id, ativo, obra:obra_id(nome)")
      .order("ativo", { ascending: false })
      .order("nome"),
    r.ctx.supabase.from("obras").select("id, nome").order("nome"),
  ])

  const locaisMapped = (locais ?? []).map((l) => ({
    id: l.id,
    nome: l.nome,
    tipo: l.tipo as "central" | "obra",
    obra_id: l.obra_id,
    obra_nome: one<ObraRel>(l.obra)?.nome ?? null,
    ativo: l.ativo,
  }))

  return (
    <div className="container py-8 space-y-6">
      <PageHeader
        icon={<MapPin />}
        title="Locais de estoque"
        description="Centrais (almoxarifado) e locais de obra onde os EPIs ficam estocados."
        actions={
          <Button variant="outline" asChild>
            <Link href="/epis/estoque"><ArrowLeft className="h-4 w-4" />Voltar ao estoque</Link>
          </Button>
        }
      />
      <LocaisClient
        locais={locaisMapped}
        obras={obras ?? []}
        criar={criarLocal}
        atualizar={atualizarLocal}
        inativar={inativarLocal}
      />
    </div>
  )
}

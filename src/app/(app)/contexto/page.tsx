import { checkRole } from "@/lib/auth/guards"
import { Network } from "lucide-react"
import { ContextoManager } from "./contexto-manager"

export default async function ContextoPage() {
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Direção.</div>

  const [{ data: questoes }, { data: partes }, { data: escopo }] = await Promise.all([
    r.ctx.supabase.from("contexto_questao").select("id, tipo, descricao, ativo").order("tipo").order("created_at"),
    r.ctx.supabase.from("parte_interessada").select("id, nome, tipo, necessidades, requisitos, ativo").order("nome"),
    r.ctx.supabase.from("escopo_sgsst").select("conteudo, exclusoes, aprovado_por_nome, data_aprovacao").maybeSingle(),
  ])

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Network className="h-7 w-7" /> Contexto e partes interessadas</h1>
        <p className="text-muted-foreground">ISO 45001 — 4.1 (questões), 4.2 (partes interessadas) e 4.3/4.4 (escopo do SGSST).</p>
      </div>
      <ContextoManager questoes={questoes ?? []} partes={partes ?? []} escopo={escopo ?? null} />
    </div>
  )
}

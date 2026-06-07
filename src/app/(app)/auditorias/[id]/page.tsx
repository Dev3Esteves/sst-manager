import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { AuditoriaForm } from "../auditoria-form"
import { ConstatacoesManager } from "../constatacoes-manager"
import { updateAuditoria } from "../actions"
import type { AuditoriaInput } from "@/lib/validations/auditoria"

export default async function EditAuditoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const [{ data: auditoria }, { data: obras }, { data: constatacoes }] = await Promise.all([
    r.ctx.supabase.from("auditoria").select("*").eq("id", id).single(),
    r.ctx.supabase.from("obras").select("id, nome").eq("ativa", true).order("nome"),
    r.ctx.supabase.from("auditoria_constatacao").select("id, tipo, clausula, descricao").eq("auditoria_id", id).order("created_at"),
  ])
  if (!auditoria) notFound()

  async function handleUpdate(payload: AuditoriaInput) {
    "use server"
    return updateAuditoria(id, payload)
  }
  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <AuditoriaForm auditoria={auditoria} obras={obras ?? []} action={handleUpdate} />
      <ConstatacoesManager auditoriaId={id} constatacoes={constatacoes ?? []} />
    </div>
  )
}

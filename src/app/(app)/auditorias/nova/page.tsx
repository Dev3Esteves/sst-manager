import { checkRole } from "@/lib/auth/guards"
import { AuditoriaForm } from "../auditoria-form"
import { createAuditoria } from "../actions"

export default async function NovaAuditoriaPage() {
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  const { data: obras } = await r.ctx.supabase.from("obras").select("id, nome").eq("ativa", true).order("nome")
  return <div className="container py-8 max-w-3xl"><AuditoriaForm obras={obras ?? []} action={createAuditoria} /></div>
}

import { checkRole } from "@/lib/auth/guards"
import { PlanoForm } from "../plano-form"
import { createPlano } from "../actions"

export default async function NovoPlanoPage() {
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "encarregado_campo"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  const { data: obras } = await r.ctx.supabase.from("obras").select("id, nome").eq("ativa", true).order("nome")
  return <div className="container py-8 max-w-3xl"><PlanoForm obras={obras ?? []} action={createPlano} /></div>
}

import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { PlanoForm } from "../plano-form"
import { updatePlano } from "../actions"
import type { PlanoEmergenciaInput } from "@/lib/validations/plano-emergencia"

export default async function EditPlanoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "encarregado_campo"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const [{ data: plano }, { data: obras }] = await Promise.all([
    r.ctx.supabase.from("plano_emergencia").select("*").eq("id", id).single(),
    r.ctx.supabase.from("obras").select("id, nome").eq("ativa", true).order("nome"),
  ])
  if (!plano) notFound()

  async function handleUpdate(payload: PlanoEmergenciaInput) {
    "use server"
    return updatePlano(id, payload)
  }
  return <div className="container py-8 max-w-3xl"><PlanoForm plano={plano} obras={obras ?? []} action={handleUpdate} /></div>
}

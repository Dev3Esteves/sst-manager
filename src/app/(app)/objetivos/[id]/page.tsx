import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { ObjetivoForm } from "../objetivo-form"
import { updateObjetivo } from "../actions"
import type { ObjetivoInput } from "@/lib/validations/objetivo"

export default async function EditObjetivoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: objetivo } = await r.ctx.supabase.from("objetivo_sst").select("*").eq("id", id).single()
  if (!objetivo) notFound()

  async function handleUpdate(payload: ObjetivoInput) {
    "use server"
    return updateObjetivo(id, payload)
  }
  return <div className="container py-8 max-w-3xl"><ObjetivoForm objetivo={objetivo} action={handleUpdate} /></div>
}

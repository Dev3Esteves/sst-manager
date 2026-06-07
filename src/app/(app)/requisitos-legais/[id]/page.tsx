import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { RequisitoForm } from "../requisito-form"
import { updateRequisito } from "../actions"
import type { RequisitoLegalInput } from "@/lib/validations/requisito-legal"

export default async function EditRequisitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: requisito } = await r.ctx.supabase.from("requisito_legal").select("*").eq("id", id).single()
  if (!requisito) notFound()

  async function handleUpdate(payload: RequisitoLegalInput) {
    "use server"
    return updateRequisito(id, payload)
  }
  return <div className="container py-8 max-w-3xl"><RequisitoForm requisito={requisito} action={handleUpdate} /></div>
}

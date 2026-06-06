import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { MedicoForm } from "../medico-form"
import { updateMedico } from "../actions"
import type { MedicoInput } from "@/lib/validations/medico"

export default async function EditMedicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "tec_seguranca", "rh_administrativo"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: medico } = await r.ctx.supabase
    .from("medicos")
    .select("id, nome, crm, uf_crm, especialidade, status, telefone, email, observacoes")
    .eq("id", id)
    .single()
  if (!medico) notFound()

  async function handleUpdate(payload: MedicoInput) {
    "use server"
    return updateMedico(id, payload)
  }

  return (
    <div className="container py-8 max-w-3xl">
      <MedicoForm medico={medico} action={handleUpdate} />
    </div>
  )
}

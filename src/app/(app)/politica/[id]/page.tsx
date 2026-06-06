import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { PoliticaForm } from "../politica-form"
import { updatePolitica } from "../actions"
import type { PoliticaInput } from "@/lib/validations/politica"

export default async function EditPoliticaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: politica } = await r.ctx.supabase.from("politica_sst").select("*").eq("id", id).single()
  if (!politica) notFound()

  async function handleUpdate(payload: PoliticaInput) {
    "use server"
    return updatePolitica(id, payload)
  }
  return <div className="container py-8 max-w-3xl"><PoliticaForm politica={politica} action={handleUpdate} /></div>
}

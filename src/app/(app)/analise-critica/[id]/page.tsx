import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { AnaliseForm } from "../analise-form"
import { updateAnalise } from "../actions"
import type { AnaliseCriticaInput } from "@/lib/validations/analise-critica"

export default async function EditAnalisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: analise } = await r.ctx.supabase.from("analise_critica").select("*").eq("id", id).single()
  if (!analise) notFound()

  async function handleUpdate(payload: AnaliseCriticaInput) {
    "use server"
    return updateAnalise(id, payload)
  }
  return <div className="container py-8 max-w-3xl"><AnaliseForm analise={analise} action={handleUpdate} /></div>
}

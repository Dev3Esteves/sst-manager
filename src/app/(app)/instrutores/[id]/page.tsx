import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { InstrutorForm } from "../instrutor-form"
import { updateInstrutor } from "../actions"
import type { InstrutorInput } from "@/lib/validations/instrutor"

export default async function EditInstrutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: instrutor } = await r.ctx.supabase
    .from("instrutores")
    .select("id, nome, registro_tipo, registro_numero, formacao, telefone, email, observacoes, ativo")
    .eq("id", id).single()
  if (!instrutor) notFound()

  async function handleUpdate(payload: InstrutorInput) {
    "use server"
    return updateInstrutor(id, payload)
  }
  return <div className="container py-8 max-w-3xl"><InstrutorForm instrutor={{ ...instrutor, ativo: !!instrutor.ativo }} action={handleUpdate} /></div>
}

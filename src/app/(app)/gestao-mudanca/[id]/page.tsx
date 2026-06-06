import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { MudancaForm } from "../mudanca-form"
import { updateMudanca } from "../actions"
import type { GestaoMudancaInput } from "@/lib/validations/gestao-mudanca"

export default async function EditMudancaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const [{ data: mudanca }, { data: obras }] = await Promise.all([
    r.ctx.supabase.from("gestao_mudanca").select("*").eq("id", id).single(),
    r.ctx.supabase.from("obras").select("id, nome").eq("ativa", true).order("nome"),
  ])
  if (!mudanca) notFound()

  async function handleUpdate(payload: GestaoMudancaInput) {
    "use server"
    return updateMudanca(id, payload)
  }
  return <div className="container py-8 max-w-3xl"><MudancaForm mudanca={mudanca} obras={obras ?? []} action={handleUpdate} /></div>
}

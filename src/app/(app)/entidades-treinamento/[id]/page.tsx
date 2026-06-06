import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { EntidadeForm } from "../entidade-form"
import { updateEntidade } from "../actions"
import type { EntidadeTreinamentoInput } from "@/lib/validations/entidade-treinamento"

export default async function EditEntidadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: entidade } = await r.ctx.supabase
    .from("entidades_treinamento")
    .select("id, nome, nome_fantasia, cnpj, cep, logradouro, numero, complemento, bairro, municipio, uf, telefone, email, ativo")
    .eq("id", id).single()
  if (!entidade) notFound()

  async function handleUpdate(payload: EntidadeTreinamentoInput) {
    "use server"
    return updateEntidade(id, payload)
  }
  return <div className="container py-8 max-w-3xl"><EntidadeForm entidade={{ ...entidade, ativo: !!entidade.ativo }} action={handleUpdate} /></div>
}

import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { ClinicaForm } from "../clinica-form"
import { updateClinica } from "../actions"
import type { ClinicaInput } from "@/lib/validations/clinica"

export default async function EditClinicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "tec_seguranca", "rh_administrativo"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: clinica } = await r.ctx.supabase
    .from("clinicas")
    .select("id, nome, nome_fantasia, cnpj, cep, logradouro, numero, complemento, bairro, municipio, uf, telefone, email, ativo")
    .eq("id", id)
    .single()
  if (!clinica) notFound()

  async function handleUpdate(payload: ClinicaInput) {
    "use server"
    return updateClinica(id, payload)
  }

  return (
    <div className="container py-8 max-w-3xl">
      <ClinicaForm clinica={{ ...clinica, ativo: !!clinica.ativo }} action={handleUpdate} />
    </div>
  )
}

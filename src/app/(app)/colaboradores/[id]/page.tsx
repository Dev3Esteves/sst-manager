import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ColaboradorForm } from "../colaborador-form"
import { updateColaborador, inativarColaborador } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function EditColaboradorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [
    { data: colaborador },
    { data: empresas },
    { data: cargos },
    { data: obras },
  ] = await Promise.all([
    supabase.from("colaboradores").select("*").eq("id", id).single(),
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("cargos").select("id, titulo").order("titulo"),
    supabase.from("obras").select("id, nome, empresa_id").eq("ativa", true).order("nome"),
  ])
  if (!colaborador) notFound()

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex justify-end mb-4">
        <InativarButton action={inativarColaborador.bind(null, id)} entityName="colaborador" />
      </div>
      <ColaboradorForm
        colaborador={colaborador}
        empresas={empresas ?? []}
        cargos={cargos ?? []}
        obras={obras ?? []}
        action={updateColaborador.bind(null, id)}
      />
    </div>
  )
}

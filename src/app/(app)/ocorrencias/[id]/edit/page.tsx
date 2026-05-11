import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OcorrenciaForm } from "../../new/ocorrencia-form"
import { updateOcorrencia } from "../../actions"
import type { OcorrenciaInput } from "@/lib/validations/ocorrencia"

export default async function EditOcorrenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: ocorrencia }, { data: empresas }, { data: colaboradores }] = await Promise.all([
    supabase.from("ocorrencias").select("*").eq("id", id).single(),
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("colaboradores").select("id, nome_completo").eq("status", "ativo").order("nome_completo"),
  ])
  if (!ocorrencia) notFound()

  async function handleUpdate(payload: OcorrenciaInput) {
    "use server"
    return updateOcorrencia(id, payload)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <OcorrenciaForm
        ocorrencia={ocorrencia}
        empresas={empresas ?? []}
        colaboradores={colaboradores ?? []}
        action={handleUpdate}
      />
    </div>
  )
}

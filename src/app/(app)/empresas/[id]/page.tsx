import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EmpresaForm } from "../empresa-form"
import { updateEmpresa, inativarEmpresa } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function EditEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: empresa }, { data: donas }] = await Promise.all([
    supabase.from("empresas").select("*").eq("id", id).single(),
    supabase
      .from("empresas")
      .select("id, razao_social")
      .eq("dona_sistema", true)
      .neq("id", id) // nunca pode ser mãe de si mesma
      .order("razao_social"),
  ])
  if (!empresa) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-end mb-4">
        <InativarButton action={inativarEmpresa.bind(null, id)} entityName="empresa" />
      </div>
      <EmpresaForm
        empresa={empresa}
        donasDisponiveis={donas ?? []}
        action={updateEmpresa.bind(null, id)}
      />
    </div>
  )
}

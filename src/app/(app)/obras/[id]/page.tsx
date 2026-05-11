import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ObraForm } from "../obra-form"
import { updateObra, inativarObra } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function EditObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: obra }, { data: donas }, { data: contratantes }] = await Promise.all([
    supabase.from("obras").select("*").eq("id", id).single(),
    supabase
      .from("empresas")
      .select("id, razao_social")
      .eq("dona_sistema", true)
      .eq("ativo", true)
      .order("razao_social"),
    supabase
      .from("empresas")
      .select("id, razao_social")
      .eq("tipo", "contratante")
      .eq("ativo", true)
      .order("razao_social"),
  ])
  if (!obra) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-end mb-4">
        <InativarButton action={inativarObra.bind(null, id)} entityName="obra" />
      </div>
      <ObraForm
        obra={obra}
        donas={donas ?? []}
        contratantes={contratantes ?? []}
        action={updateObra.bind(null, id)}
      />
    </div>
  )
}

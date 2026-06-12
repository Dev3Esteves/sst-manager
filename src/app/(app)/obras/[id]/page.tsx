import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ObraForm } from "../obra-form"
import { updateObra, inativarObra } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"
import { ObraLocaisManager } from "./obra-locais-manager"
import { ObraEquipeManager } from "./obra-equipe-manager"

export default async function EditObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: obra }, { data: donas }, { data: contratantes }, { data: locais }] = await Promise.all([
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
    supabase.from("obra_locais").select("id, nome, tipo, ativo").eq("obra_id", id).order("created_at"),
  ])
  const { data: equipe } = await supabase
    .from("obra_equipe")
    .select("id, cargo_titulo, quantidade")
    .eq("obra_id", id)
    .order("ordem")
    .order("cargo_titulo")
  if (!obra) notFound()

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <div className="flex justify-end">
        <InativarButton action={inativarObra.bind(null, id)} entityName="obra" />
      </div>
      <ObraForm
        obra={obra}
        donas={donas ?? []}
        contratantes={contratantes ?? []}
        action={updateObra.bind(null, id)}
      />
      <ObraLocaisManager obraId={id} locais={locais ?? []} />
      <ObraEquipeManager obraId={id} equipe={equipe ?? []} />
    </div>
  )
}

import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CargoForm } from "../cargo-form"
import { updateCargo } from "../actions"

export default async function EditCargoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: cargo }, { data: empresas }, { data: epis }] = await Promise.all([
    supabase.from("cargos").select("*").eq("id", id).single(),
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
  ])
  if (!cargo) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      <CargoForm
        cargo={cargo}
        empresas={empresas ?? []}
        episDisponiveis={epis ?? []}
        action={updateCargo.bind(null, id)}
      />
    </div>
  )
}

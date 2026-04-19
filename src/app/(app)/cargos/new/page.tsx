import { createClient } from "@/lib/supabase/server"
import { CargoForm } from "../cargo-form"
import { createCargo } from "../actions"

export default async function NewCargoPage() {
  const supabase = await createClient()
  const [{ data: empresas }, { data: epis }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
  ])

  return (
    <div className="container py-8 max-w-3xl">
      <CargoForm
        empresas={empresas ?? []}
        episDisponiveis={epis ?? []}
        action={createCargo}
      />
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { ColaboradorForm } from "../colaborador-form"
import { createColaborador } from "../actions"

export default async function NewColaboradorPage() {
  const supabase = await createClient()
  const [{ data: empresas }, { data: cargos }, { data: obras }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("cargos").select("id, titulo").order("titulo"),
    supabase.from("obras").select("id, nome, empresa_id").eq("ativa", true).order("nome"),
  ])

  return (
    <div className="container py-8 max-w-4xl">
      <ColaboradorForm
        empresas={empresas ?? []}
        cargos={cargos ?? []}
        obras={obras ?? []}
        action={createColaborador}
      />
    </div>
  )
}

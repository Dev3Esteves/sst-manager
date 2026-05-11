import { createClient } from "@/lib/supabase/server"
import { NcForm } from "../nc-form"
import { createNc } from "../actions"

export default async function NewNcPage() {
  const supabase = await createClient()
  const [{ data: empresas }, { data: obras }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("obras").select("id, nome, empresa_id").eq("ativa", true).order("nome"),
  ])

  return (
    <div className="container py-8 max-w-3xl">
      <NcForm
        empresas={empresas ?? []}
        obras={obras ?? []}
        action={createNc}
        modo="criar"
      />
    </div>
  )
}

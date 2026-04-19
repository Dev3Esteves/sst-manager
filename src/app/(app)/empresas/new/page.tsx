import { createClient } from "@/lib/supabase/server"
import { EmpresaForm } from "../empresa-form"
import { createEmpresa } from "../actions"

export default async function NewEmpresaPage() {
  const supabase = await createClient()
  const { data: donas } = await supabase
    .from("empresas")
    .select("id, razao_social")
    .eq("dona_sistema", true)
    .order("razao_social")

  return (
    <div className="container py-8 max-w-3xl">
      <EmpresaForm action={createEmpresa} donasDisponiveis={donas ?? []} />
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { ObraForm } from "../obra-form"
import { createObra } from "../actions"

export default async function NewObraPage() {
  const supabase = await createClient()
  const [{ data: proprias }, { data: contratantes }] = await Promise.all([
    supabase
      .from("empresas")
      .select("id, razao_social")
      .eq("propria", true)
      .eq("ativo", true)
      .order("razao_social"),
    supabase
      .from("empresas")
      .select("id, razao_social")
      .eq("tipo", "contratante")
      .eq("ativo", true)
      .order("razao_social"),
  ])

  return (
    <div className="container py-8 max-w-3xl">
      <ObraForm
        proprias={proprias ?? []}
        contratantes={contratantes ?? []}
        action={createObra}
      />
    </div>
  )
}

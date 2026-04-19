import { createClient } from "@/lib/supabase/server"
import { OcorrenciaForm } from "./ocorrencia-form"
import { createOcorrencia } from "../actions"

export default async function NewOcorrenciaPage() {
  const supabase = await createClient()
  const [{ data: empresas }, { data: colaboradores }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("colaboradores").select("id, nome_completo").eq("status", "ativo").order("nome_completo"),
  ])

  return (
    <div className="container py-8 max-w-3xl">
      <OcorrenciaForm empresas={empresas ?? []} colaboradores={colaboradores ?? []} action={createOcorrencia} />
    </div>
  )
}

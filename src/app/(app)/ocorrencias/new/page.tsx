import { createClient } from "@/lib/supabase/server"
import { OcorrenciaForm } from "./ocorrencia-form"
import { createOcorrencia } from "../actions"

export default async function NewOcorrenciaPage() {
  const supabase = await createClient()
  const [{ data: empresas }, { data: colaboradores }, { data: locais }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("colaboradores").select("id, nome_completo").eq("status", "ativo").order("nome_completo"),
    supabase.from("obra_locais").select("id, nome, obras(nome)").eq("ativo", true).order("nome"),
  ])

  const obraLocais = (locais ?? []).map((l) => ({
    id: l.id, nome: l.nome,
    obra_nome: (Array.isArray(l.obras) ? l.obras[0] : l.obras)?.nome ?? "Obra",
  }))

  return (
    <div className="container py-8 max-w-3xl">
      <OcorrenciaForm empresas={empresas ?? []} colaboradores={colaboradores ?? []} obraLocais={obraLocais} action={createOcorrencia} />
    </div>
  )
}

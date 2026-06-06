import { createClient } from "@/lib/supabase/server"
import { ExameForm } from "../exame-form"
import { createExame } from "../actions"

export default async function NewExamePage() {
  const supabase = await createClient()
  const [{ data: colaboradores }, { data: medicos }, { data: clinicas }] = await Promise.all([
    supabase.from("colaboradores").select("id, nome_completo, cpf").eq("status", "ativo").order("nome_completo"),
    supabase.from("medicos").select("id, nome, crm, uf_crm, especialidade").neq("status", "inativo").order("nome"),
    supabase.from("clinicas").select("id, nome, municipio, uf").eq("ativo", true).order("nome"),
  ])

  return (
    <div className="container py-8 max-w-4xl">
      <ExameForm
        colaboradores={colaboradores ?? []}
        medicos={medicos ?? []}
        clinicas={clinicas ?? []}
        action={createExame}
      />
    </div>
  )
}

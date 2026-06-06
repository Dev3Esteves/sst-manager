import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExameForm } from "../exame-form"
import { updateExame, inativarExame } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function EditExamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: exame }, { data: colaboradores }, { data: medicos }, { data: clinicas }] = await Promise.all([
    supabase.from("exames_medicos").select("*").eq("id", id).single(),
    supabase.from("colaboradores").select("id, nome_completo, cpf").eq("status", "ativo").order("nome_completo"),
    supabase.from("medicos").select("id, nome, crm, uf_crm, especialidade").neq("status", "inativo").order("nome"),
    supabase.from("clinicas").select("id, nome, municipio, uf").eq("ativo", true).order("nome"),
  ])
  if (!exame) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-end mb-4">
        <InativarButton action={inativarExame.bind(null, id)} entityName="exame" />
      </div>
      <ExameForm
        exame={exame}
        colaboradores={colaboradores ?? []}
        medicos={medicos ?? []}
        clinicas={clinicas ?? []}
        action={updateExame.bind(null, id)}
      />
    </div>
  )
}

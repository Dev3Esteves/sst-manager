import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExameForm } from "../exame-form"
import { updateExame, inativarExame } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function EditExamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: exame }, { data: colaboradores }] = await Promise.all([
    supabase.from("exames_medicos").select("*").eq("id", id).single(),
    supabase.from("colaboradores").select("id, nome_completo, cpf").eq("status", "ativo").order("nome_completo"),
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
        action={updateExame.bind(null, id)}
      />
    </div>
  )
}

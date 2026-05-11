import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TreinamentoForm } from "../treinamento-form"
import { updateTreinamento, inativarTreinamento } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function EditTreinamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: treinamento } = await supabase.from("treinamentos").select("*").eq("id", id).single()
  if (!treinamento) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-end mb-4">
        <InativarButton action={inativarTreinamento.bind(null, id)} entityName="treinamento" />
      </div>
      <TreinamentoForm treinamento={treinamento} action={updateTreinamento.bind(null, id)} />
    </div>
  )
}

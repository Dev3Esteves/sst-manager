import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TreinamentoForm } from "../treinamento-form"
import { updateTreinamento } from "../actions"

export default async function EditTreinamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: treinamento } = await supabase.from("treinamentos").select("*").eq("id", id).single()
  if (!treinamento) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      <TreinamentoForm treinamento={treinamento} action={updateTreinamento.bind(null, id)} />
    </div>
  )
}

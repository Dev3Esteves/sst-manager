import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EpiForm } from "../epi-form"
import { updateEpi, inativarEpi } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function EditEpiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: epi } = await supabase.from("epis").select("*").eq("id", id).single()
  if (!epi) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-end mb-4">
        <InativarButton action={inativarEpi.bind(null, id)} entityName="EPI" />
      </div>
      <EpiForm epi={epi} action={updateEpi.bind(null, id)} />
    </div>
  )
}

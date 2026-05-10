import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RiscoForm } from "../risco-form"
import { createRisco } from "../actions"

export default async function NewRiscoPage({
  params,
}: {
  params: Promise<{ id: string; gheId: string }>
}) {
  const { id: pgrId, gheId } = await params
  const supabase = await createClient()
  const { data: ghe } = await supabase
    .from("pgr_ghe")
    .select("codigo, descricao")
    .eq("id", gheId)
    .single()
  if (!ghe) notFound()

  async function handleCreate(formData: FormData) {
    "use server"
    return createRisco(gheId, formData)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <p className="text-xs text-muted-foreground mb-2">PGR: {pgrId}</p>
      <RiscoForm
        gheLabel={`${ghe.codigo} — ${ghe.descricao}`}
        action={handleCreate}
        modo="criar"
      />
    </div>
  )
}

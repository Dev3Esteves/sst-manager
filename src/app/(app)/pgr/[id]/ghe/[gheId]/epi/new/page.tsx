import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EpiForm } from "../epi-form"
import { createEpiGhe } from "../actions"

export default async function NewEpiGhePage({
  params,
}: {
  params: Promise<{ id: string; gheId: string }>
}) {
  const { gheId } = await params
  const supabase = await createClient()
  const [{ data: ghe }, { data: catalogo }] = await Promise.all([
    supabase.from("pgr_ghe").select("codigo, descricao").eq("id", gheId).single(),
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
  ])
  if (!ghe) notFound()

  async function handleCreate(formData: FormData) {
    "use server"
    return createEpiGhe(gheId, formData)
  }

  return (
    <div className="container py-8 max-w-3xl">
      <EpiForm
        gheLabel={`${ghe.codigo} — ${ghe.descricao}`}
        catalogo={catalogo ?? []}
        action={handleCreate}
        modo="criar"
      />
    </div>
  )
}

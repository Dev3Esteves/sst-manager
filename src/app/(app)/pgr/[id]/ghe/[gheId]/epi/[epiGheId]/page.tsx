import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EpiForm } from "../epi-form"
import { updateEpiGhe, deleteEpiGhe } from "../actions"

export default async function EditEpiGhePage({
  params,
}: {
  params: Promise<{ id: string; gheId: string; epiGheId: string }>
}) {
  const { id: pgrId, gheId, epiGheId } = await params
  const supabase = await createClient()
  const [{ data: epiGhe }, { data: ghe }, { data: catalogo }] = await Promise.all([
    supabase.from("pgr_epi_ghe").select("*").eq("id", epiGheId).single(),
    supabase.from("pgr_ghe").select("codigo, descricao").eq("id", gheId).single(),
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
  ])

  if (!epiGhe || !ghe) notFound()

  async function handleUpdate(formData: FormData) {
    "use server"
    return updateEpiGhe(epiGheId, gheId, formData)
  }

  async function handleDelete() {
    "use server"
    return deleteEpiGhe(epiGheId, gheId, pgrId)
  }

  return (
    <div className="container py-8 max-w-3xl">
      <EpiForm
        epiGhe={epiGhe}
        gheLabel={`${ghe.codigo} — ${ghe.descricao}`}
        catalogo={catalogo ?? []}
        action={handleUpdate}
        onDelete={handleDelete}
        modo="editar"
      />
    </div>
  )
}

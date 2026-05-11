import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MedidaForm } from "../medida-form"
import { updateMedida, deleteMedida } from "../actions"

export default async function EditMedidaPage({
  params,
}: {
  params: Promise<{ id: string; medidaId: string }>
}) {
  const { id: pgrId, medidaId } = await params
  const supabase = await createClient()
  const [{ data: medida }, { data: pgr }, { data: ghes }] = await Promise.all([
    supabase.from("pgr_medida_controle").select("*").eq("id", medidaId).single(),
    supabase.from("pgr").select("numero_revisao, obras(nome)").eq("id", pgrId).single(),
    supabase
      .from("pgr_ghe")
      .select("id, codigo, descricao")
      .eq("pgr_id", pgrId)
      .order("ordem")
      .order("codigo"),
  ])

  if (!medida || !pgr) notFound()

  const obra = Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras

  async function handleUpdate(formData: FormData) {
    "use server"
    return updateMedida(medidaId, pgrId, formData)
  }

  async function handleDelete() {
    "use server"
    return deleteMedida(medidaId, pgrId)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <p className="text-sm text-muted-foreground mb-2">
        PGR de <span className="font-medium">{obra?.nome}</span> · Rev.{" "}
        {String(pgr.numero_revisao).padStart(2, "0")}
      </p>
      <MedidaForm
        medida={medida}
        ghes={ghes ?? []}
        action={handleUpdate}
        onDelete={handleDelete}
        modo="editar"
      />
    </div>
  )
}

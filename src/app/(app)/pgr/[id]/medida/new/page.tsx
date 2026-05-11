import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MedidaForm } from "../medida-form"
import { createMedida } from "../actions"

export default async function NewMedidaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: pgrId } = await params
  const supabase = await createClient()
  const [{ data: pgr }, { data: ghes }] = await Promise.all([
    supabase.from("pgr").select("numero_revisao, obras(nome)").eq("id", pgrId).single(),
    supabase
      .from("pgr_ghe")
      .select("id, codigo, descricao")
      .eq("pgr_id", pgrId)
      .order("ordem")
      .order("codigo"),
  ])
  if (!pgr) notFound()

  const obra = Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras

  async function handleCreate(formData: FormData) {
    "use server"
    return createMedida(pgrId, formData)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <p className="text-sm text-muted-foreground mb-2">
        PGR de <span className="font-medium">{obra?.nome}</span> · Rev.{" "}
        {String(pgr.numero_revisao).padStart(2, "0")}
      </p>
      <MedidaForm ghes={ghes ?? []} action={handleCreate} modo="criar" />
    </div>
  )
}

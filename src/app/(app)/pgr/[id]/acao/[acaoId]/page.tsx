import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AcaoForm } from "../acao-form"
import { updateAcao, deleteAcao } from "../actions"

export default async function EditAcaoPage({
  params,
}: {
  params: Promise<{ id: string; acaoId: string }>
}) {
  const { id: pgrId, acaoId } = await params
  const supabase = await createClient()
  const [{ data: acao }, { data: pgr }] = await Promise.all([
    supabase.from("pgr_acao").select("*").eq("id", acaoId).single(),
    supabase.from("pgr").select("numero_revisao, obras(nome)").eq("id", pgrId).single(),
  ])

  if (!acao || !pgr) notFound()

  const obra = Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras

  async function handleUpdate(formData: FormData) {
    "use server"
    return updateAcao(acaoId, pgrId, formData)
  }

  async function handleDelete() {
    "use server"
    return deleteAcao(acaoId, pgrId)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <p className="text-sm text-muted-foreground mb-2">
        PGR de <span className="font-medium">{obra?.nome}</span> · Rev.{" "}
        {String(pgr.numero_revisao).padStart(2, "0")}
      </p>
      <AcaoForm
        acao={acao}
        action={handleUpdate}
        onDelete={handleDelete}
        modo="editar"
      />
    </div>
  )
}

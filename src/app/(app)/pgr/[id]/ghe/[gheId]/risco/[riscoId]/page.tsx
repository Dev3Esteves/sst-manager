import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RiscoForm } from "../risco-form"
import { updateRisco, deleteRisco } from "../actions"
import type { EsocialAgenteCatalog } from "../esocial-agente-combobox"

export default async function EditRiscoPage({
  params,
}: {
  params: Promise<{ id: string; gheId: string; riscoId: string }>
}) {
  const { id: pgrId, gheId, riscoId } = await params
  const supabase = await createClient()

  const [{ data: risco }, { data: ghe }, { data: catalogo }] = await Promise.all([
    supabase.from("pgr_risco").select("*").eq("id", riscoId).single(),
    supabase.from("pgr_ghe").select("codigo, descricao").eq("id", gheId).single(),
    supabase
      .from("esocial_agente_nocivo")
      .select("codigo, descricao, grupo, exige_aposentadoria_especial, observacao")
      .eq("ativo", true)
      .order("codigo")
      .returns<EsocialAgenteCatalog[]>(),
  ])

  if (!risco || !ghe) notFound()

  async function handleUpdate(formData: FormData) {
    "use server"
    return updateRisco(riscoId, gheId, formData)
  }

  async function handleDelete() {
    "use server"
    return deleteRisco(riscoId, gheId, pgrId)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <RiscoForm
        risco={risco}
        gheLabel={`${ghe.codigo} — ${ghe.descricao}`}
        catalogoEsocial={catalogo ?? []}
        action={handleUpdate}
        onDelete={handleDelete}
        modo="editar"
      />
    </div>
  )
}

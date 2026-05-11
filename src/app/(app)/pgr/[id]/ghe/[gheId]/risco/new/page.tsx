import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RiscoForm } from "../risco-form"
import { createRisco } from "../actions"
import type { EsocialAgenteCatalog } from "../esocial-agente-combobox"

export default async function NewRiscoPage({
  params,
}: {
  params: Promise<{ id: string; gheId: string }>
}) {
  const { id: pgrId, gheId } = await params
  const supabase = await createClient()
  const [{ data: ghe }, { data: catalogo }] = await Promise.all([
    supabase.from("pgr_ghe").select("codigo, descricao").eq("id", gheId).single(),
    supabase
      .from("esocial_agente_nocivo")
      .select("codigo, descricao, grupo, exige_aposentadoria_especial, observacao")
      .eq("ativo", true)
      .order("codigo")
      .returns<EsocialAgenteCatalog[]>(),
  ])
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
        catalogoEsocial={catalogo ?? []}
        action={handleCreate}
        modo="criar"
      />
    </div>
  )
}

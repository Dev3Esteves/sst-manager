import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GheForm } from "../ghe-form"
import { updateGhe, deleteGhe } from "../actions"
import { CargosEditor } from "./cargos-editor"

export default async function EditGhePage({
  params,
}: {
  params: Promise<{ id: string; gheId: string }>
}) {
  const { id: pgrId, gheId } = await params
  const supabase = await createClient()

  const [{ data: ghe }, { data: cargos }, { data: pgr }] = await Promise.all([
    supabase.from("pgr_ghe").select("*").eq("id", gheId).single(),
    supabase
      .from("pgr_ghe_cargo")
      .select("id, cargo_titulo, cargo_id")
      .eq("pgr_ghe_id", gheId)
      .order("ordem")
      .order("cargo_titulo"),
    supabase
      .from("pgr")
      .select("numero_revisao, obras(nome)")
      .eq("id", pgrId)
      .single(),
  ])

  if (!ghe || !pgr) notFound()

  const obra = Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras

  async function handleDelete() {
    "use server"
    return deleteGhe(gheId, pgrId)
  }

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <p className="text-sm text-muted-foreground">
        PGR de <span className="font-medium">{obra?.nome}</span> · Rev.{" "}
        {String(pgr.numero_revisao).padStart(2, "0")}
      </p>

      <GheForm
        pgrId={pgrId}
        ghe={ghe}
        action={updateGhe.bind(null, gheId)}
        onDelete={handleDelete}
        modo="editar"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cargos vinculados ao GHE</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Liste os cargos/funções que pertencem a este GHE (Anexo II). Mesmo cargo
            pode aparecer em vários GHEs entre obras. Persistência é imediata —
            adicione e remova sem precisar salvar o formulário.
          </p>
          <CargosEditor gheId={gheId} pgrId={pgrId} cargos={cargos ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}

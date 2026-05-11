import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GheForm } from "../ghe-form"
import { createGhe } from "../actions"

export default async function NewGhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: pgr } = await supabase
    .from("pgr")
    .select("id, obra_id, numero_revisao, obras(nome)")
    .eq("id", id)
    .single()
  if (!pgr) notFound()

  const obra = Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras

  return (
    <div className="container py-8 max-w-4xl">
      <p className="text-sm text-muted-foreground mb-2">
        PGR de <span className="font-medium">{obra?.nome}</span> · Rev.{" "}
        {String(pgr.numero_revisao).padStart(2, "0")}
      </p>
      <GheForm pgrId={id} action={createGhe} modo="criar" />
    </div>
  )
}

import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AcaoForm } from "../acao-form"
import { createAcao } from "../actions"

export default async function NewAcaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pgrId } = await params
  const supabase = await createClient()
  const [{ data: pgr }, { data: maiorItem }] = await Promise.all([
    supabase.from("pgr").select("numero_revisao, obras(nome)").eq("id", pgrId).single(),
    supabase
      .from("pgr_acao")
      .select("numero_item")
      .eq("pgr_id", pgrId)
      .order("numero_item", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (!pgr) notFound()

  const obra = Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras
  const proximo = (maiorItem?.numero_item ?? 0) + 1

  async function handleCreate(formData: FormData) {
    "use server"
    return createAcao(pgrId, formData)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <p className="text-sm text-muted-foreground mb-2">
        PGR de <span className="font-medium">{obra?.nome}</span> · Rev.{" "}
        {String(pgr.numero_revisao).padStart(2, "0")}
      </p>
      <AcaoForm proximoNumeroItem={proximo} action={handleCreate} modo="criar" />
    </div>
  )
}

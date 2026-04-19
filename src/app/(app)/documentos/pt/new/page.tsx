import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PtForm } from "./pt-form"
import { createPt } from "../../actions"
import { PT_TIPOS, type PtTipo } from "@/lib/validations/pt"

export default async function NewPtPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const params = await searchParams
  const tipoRaw = params.tipo ?? "altura"
  if (!PT_TIPOS.includes(tipoRaw as PtTipo)) redirect("/documentos/new")
  const tipo = tipoRaw as PtTipo

  const supabase = await createClient()
  const { data: empresas } = await supabase
    .from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social")

  return (
    <div className="container py-8 max-w-4xl">
      <PtForm tipo={tipo} empresas={empresas ?? []} action={createPt} />
    </div>
  )
}

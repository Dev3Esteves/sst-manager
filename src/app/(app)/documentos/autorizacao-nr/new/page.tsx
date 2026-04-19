import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AutorizacaoNrForm } from "./autorizacao-form"
import { createAutorizacaoNr } from "../../actions"

type Nr = "NR-10" | "NR-35" | "NR-33"

export default async function NewAutorizacaoNrPage({ searchParams }: { searchParams: Promise<{ nr?: string }> }) {
  const params = await searchParams
  const nrRaw = params.nr ?? "NR-10"
  if (!["NR-10", "NR-35", "NR-33"].includes(nrRaw)) redirect("/documentos/new")
  const nr = nrRaw as Nr

  const supabase = await createClient()
  const [{ data: empresas }, { data: colaboradores }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("colaboradores").select("id, nome_completo, cpf, cargos(titulo)").eq("status", "ativo").order("nome_completo"),
  ])

  return (
    <div className="container py-8 max-w-4xl">
      <AutorizacaoNrForm
        nr={nr}
        empresas={empresas ?? []}
        colaboradores={(colaboradores ?? []).map(c => ({
          id: c.id, nome_completo: c.nome_completo, cpf: c.cpf,
          cargo_titulo: (Array.isArray(c.cargos) ? c.cargos[0] : c.cargos)?.titulo ?? null,
        }))}
        action={createAutorizacaoNr}
      />
    </div>
  )
}

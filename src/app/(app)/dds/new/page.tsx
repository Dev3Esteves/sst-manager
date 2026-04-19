import { createClient } from "@/lib/supabase/server"
import { DDSForm } from "./dds-form"
import { createDDS } from "../actions"
import { formatCPF } from "@/lib/validations/shared"

export default async function NewDDSPage() {
  const supabase = await createClient()
  const [{ data: empresas }, { data: colaboradores }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("colaboradores")
      .select("id, nome_completo, cpf, empresa_id, cargos(titulo)")
      .eq("status", "ativo")
      .order("nome_completo"),
  ])

  return (
    <div className="container py-8 max-w-5xl">
      <DDSForm
        empresas={empresas ?? []}
        colaboradores={(colaboradores ?? []).map((c) => ({
          id: c.id,
          nome_completo: c.nome_completo,
          cpf: formatCPF(c.cpf),
          empresa_id: c.empresa_id,
          cargo_titulo: (Array.isArray(c.cargos) ? c.cargos[0] : c.cargos)?.titulo ?? null,
        }))}
        action={createDDS}
      />
    </div>
  )
}

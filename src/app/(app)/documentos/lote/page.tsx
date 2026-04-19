import { createClient } from "@/lib/supabase/server"
import { LoteForm } from "./lote-form"

export default async function LoteDocsPage() {
  const supabase = await createClient()

  const [{ data: empresas }, { data: colaboradores }, { data: treinamentos }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("colaboradores")
      .select("id, nome_completo, cpf, empresa_id, cargos(titulo)")
      .eq("status", "ativo")
      .order("nome_completo"),
    supabase.from("treinamentos")
      .select("id, titulo, nr_referencia, carga_horaria_horas")
      .order("titulo"),
  ])

  return (
    <div className="container py-8 max-w-6xl">
      <LoteForm
        empresas={empresas ?? []}
        colaboradores={(colaboradores ?? []).map((c) => ({
          id: c.id,
          nome_completo: c.nome_completo,
          cpf: c.cpf,
          empresa_id: c.empresa_id,
          cargo_titulo: (Array.isArray(c.cargos) ? c.cargos[0] : c.cargos)?.titulo ?? null,
        }))}
        treinamentos={treinamentos ?? []}
      />
    </div>
  )
}

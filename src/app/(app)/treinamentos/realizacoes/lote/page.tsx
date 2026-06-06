import { createClient } from "@/lib/supabase/server"
import { LoteForm } from "./lote-form"
import { aplicarTreinamentoEmLote } from "../../actions"

export default async function LoteRealizacaoPage() {
  const supabase = await createClient()
  const [{ data: treinamentos }, { data: colaboradores }, { data: instrutores }, { data: entidades }] = await Promise.all([
    supabase.from("treinamentos").select("id, titulo, nr_referencia, validade_meses").order("titulo"),
    supabase.from("colaboradores").select("id, nome_completo, cargos(titulo)").eq("status", "ativo").order("nome_completo"),
    supabase.from("instrutores").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("entidades_treinamento").select("id, nome").eq("ativo", true).order("nome"),
  ])

  return (
    <div className="container py-8 max-w-3xl">
      <LoteForm
        treinamentos={treinamentos ?? []}
        colaboradores={(colaboradores ?? []).map((c) => ({
          id: c.id,
          nome_completo: c.nome_completo,
          cargo_titulo: (Array.isArray(c.cargos) ? c.cargos[0] : c.cargos)?.titulo ?? null,
        }))}
        instrutores={instrutores ?? []}
        entidades={entidades ?? []}
        action={aplicarTreinamentoEmLote}
      />
    </div>
  )
}

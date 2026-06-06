import { createClient } from "@/lib/supabase/server"
import { RealizacaoForm } from "./realizacao-form"
import { createRealizacao } from "../../actions"

export default async function NewRealizacaoPage() {
  const supabase = await createClient()
  const [{ data: colaboradores }, { data: treinamentos }, { data: instrutores }, { data: entidades }] = await Promise.all([
    supabase.from("colaboradores").select("id, nome_completo").eq("status", "ativo").order("nome_completo"),
    supabase.from("treinamentos").select("id, titulo, nr_referencia, validade_meses").order("titulo"),
    supabase.from("instrutores").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("entidades_treinamento").select("id, nome").eq("ativo", true).order("nome"),
  ])

  return (
    <div className="container py-8 max-w-3xl">
      <RealizacaoForm
        colaboradores={colaboradores ?? []}
        treinamentos={treinamentos ?? []}
        instrutores={instrutores ?? []}
        entidades={entidades ?? []}
        action={createRealizacao}
      />
    </div>
  )
}

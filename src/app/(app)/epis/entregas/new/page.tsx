import { createClient } from "@/lib/supabase/server"
import { EntregaForm } from "./entrega-form"
import { createEntrega } from "../actions"

export default async function NewEntregaPage() {
  const supabase = await createClient()
  const [{ data: colaboradores }, { data: epis }] = await Promise.all([
    supabase.from("colaboradores").select("id, nome_completo").eq("status", "ativo").order("nome_completo"),
    supabase.from("epis").select("id, descricao, ca, ca_validade").order("descricao"),
  ])

  return (
    <div className="container py-8 max-w-3xl">
      <EntregaForm colaboradores={colaboradores ?? []} epis={epis ?? []} action={createEntrega} />
    </div>
  )
}

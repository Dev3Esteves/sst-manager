import { createClient } from "@/lib/supabase/server"
import { PgrForm } from "../pgr-form"
import { createPgr } from "../actions"

export default async function NewPgrPage() {
  const supabase = await createClient()
  const { data: obras } = await supabase
    .from("obras")
    .select(`
      id, nome, codigo, cno, num_empregados_max, data_inicio,
      empresa:empresas!obras_empresa_id_fkey(razao_social)
    `)
    .eq("ativa", true)
    .order("nome")

  return (
    <div className="container py-8 max-w-4xl">
      <PgrForm obras={obras ?? []} action={createPgr} modo="criar" />
    </div>
  )
}

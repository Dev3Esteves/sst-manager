import { createClient } from "@/lib/supabase/server"
import { ExameForm } from "../exame-form"
import { createExame } from "../actions"

export default async function NewExamePage() {
  const supabase = await createClient()
  const { data: colaboradores } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, cpf")
    .eq("status", "ativo")
    .order("nome_completo")

  return (
    <div className="container py-8 max-w-4xl">
      <ExameForm colaboradores={colaboradores ?? []} action={createExame} />
    </div>
  )
}

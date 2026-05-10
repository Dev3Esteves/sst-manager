import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PgrForm } from "../../pgr-form"
import { updatePgr } from "../../actions"

export default async function EditPgrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: pgr }, { data: obras }] = await Promise.all([
    supabase.from("pgr").select("*").eq("id", id).single(),
    supabase
      .from("obras")
      .select(`
        id, nome, codigo, cno, num_empregados_max, data_inicio,
        empresa:empresas!obras_empresa_id_fkey(razao_social)
      `)
      .eq("ativa", true)
      .order("nome"),
  ])

  if (!pgr) notFound()

  return (
    <div className="container py-8 max-w-4xl">
      <PgrForm
        pgr={pgr}
        obras={obras ?? []}
        action={updatePgr.bind(null, id)}
        modo="editar"
      />
    </div>
  )
}

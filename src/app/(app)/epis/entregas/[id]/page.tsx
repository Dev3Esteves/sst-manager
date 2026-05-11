import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EntregaForm } from "../new/entrega-form"
import { updateEntrega, inativarEntrega } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"
import type { EpiEntregaInput } from "@/lib/validations/epi-entrega"

export default async function EditEntregaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: entrega }, { data: colaboradores }, { data: epis }] = await Promise.all([
    supabase.from("epi_entregas").select("*").eq("id", id).single(),
    supabase.from("colaboradores").select("id, nome_completo").eq("status", "ativo").order("nome_completo"),
    supabase.from("epis").select("id, descricao, ca, ca_validade").order("descricao"),
  ])
  if (!entrega) notFound()

  async function handleUpdate(payload: EpiEntregaInput) {
    "use server"
    return updateEntrega(id, payload)
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-end mb-4">
        <InativarButton action={inativarEntrega.bind(null, id)} entityName="entrega" />
      </div>
      <EntregaForm
        entrega={entrega}
        colaboradores={colaboradores ?? []}
        epis={epis ?? []}
        action={handleUpdate}
      />
    </div>
  )
}

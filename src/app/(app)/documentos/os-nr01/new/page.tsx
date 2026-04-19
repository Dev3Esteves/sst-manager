import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { FileCheck2 } from "lucide-react"
import { OsNr01Form } from "./os-nr01-form"

export default async function NewOsNr01Page() {
  const supabase = await createClient()

  const [{ data: cargos }, { data: obras }, { data: empresas }] = await Promise.all([
    supabase
      .from("cargos")
      .select(`
        id, titulo, descricao_atividades, riscos_associados, epis_obrigatorios,
        empresa_id,
        empresas(razao_social)
      `)
      .order("titulo"),
    supabase
      .from("obras")
      .select("id, nome, empresa_id")
      .eq("ativa", true)
      .order("nome"),
    supabase
      .from("empresas")
      .select("id, razao_social")
      .eq("ativo", true)
      .order("razao_social"),
  ])

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <PageHeader
        icon={<FileCheck2 />}
        title="Ordem de Serviço NR-01"
        description="Selecione a função e a obra. Será emitida uma OS para cada colaborador da função alocado na obra, com os riscos e EPIs do cargo pré-preenchidos."
      />
      <OsNr01Form
        cargos={cargos ?? []}
        obras={obras ?? []}
        empresas={empresas ?? []}
      />
    </div>
  )
}

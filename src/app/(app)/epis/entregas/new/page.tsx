import { createClient } from "@/lib/supabase/server"
import { EntregaForm } from "./entrega-form"
import { createEntrega } from "../actions"

export default async function NewEntregaPage() {
  const supabase = await createClient()
  const [{ data: colaboradores }, { data: epis }, { data: matriz }] = await Promise.all([
    supabase.from("colaboradores").select("id, nome_completo, cargo_id").eq("status", "ativo").order("nome_completo"),
    supabase.from("epis").select("id, descricao, ca, ca_validade").order("descricao"),
    supabase.from("epi_cargo").select("cargo_id, epis(descricao)"),
  ])

  // Mapa cargo_id -> descrições de EPIs obrigatórios
  const porCargo: Record<string, string[]> = {}
  for (const m of matriz ?? []) {
    const epi = Array.isArray(m.epis) ? m.epis[0] : m.epis
    if (!epi?.descricao) continue
    ;(porCargo[m.cargo_id] ??= []).push(epi.descricao)
  }
  // Mapa colaborador_id -> EPIs obrigatórios (via cargo)
  const obrigatoriosPorColaborador: Record<string, string[]> = {}
  for (const c of colaboradores ?? []) {
    if (c.cargo_id && porCargo[c.cargo_id]) obrigatoriosPorColaborador[c.id] = porCargo[c.cargo_id]
  }

  return (
    <div className="container py-8 max-w-3xl">
      <EntregaForm
        colaboradores={(colaboradores ?? []).map((c) => ({ id: c.id, nome_completo: c.nome_completo }))}
        epis={epis ?? []}
        action={createEntrega}
        obrigatoriosPorColaborador={obrigatoriosPorColaborador}
      />
    </div>
  )
}

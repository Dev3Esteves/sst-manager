import { createClient } from "@/lib/supabase/server"
import { TransferenciaForm } from "../transferencia-form"
import { transferir } from "../actions"

export default async function NovaTransferenciaPage() {
  const supabase = await createClient()
  const [locaisRes, episRes, saldosRes] = await Promise.all([
    supabase.from("estoque_local").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
    supabase.from("estoque_saldo").select("epi_id, local_id, quantidade"),
  ])

  // Mapa `epi_id|local_id` → quantidade, para exibir o saldo da origem.
  const saldos: Record<string, number> = {}
  for (const s of saldosRes.data ?? []) {
    saldos[`${s.epi_id}|${s.local_id}`] = s.quantidade
  }

  return (
    <div className="container py-8 max-w-3xl">
      <TransferenciaForm
        locais={locaisRes.data ?? []}
        epis={episRes.data ?? []}
        saldos={saldos}
        action={transferir}
      />
    </div>
  )
}

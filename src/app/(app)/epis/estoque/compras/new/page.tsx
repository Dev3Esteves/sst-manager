import { createClient } from "@/lib/supabase/server"
import { CompraForm } from "../compra-form"
import { salvarCompra } from "../actions"

export default async function NovaCompraPage() {
  const supabase = await createClient()
  const [fornecedoresRes, locaisRes, episRes] = await Promise.all([
    // Fornecedor = empresa do tenant com papel 'fornecedor'.
    supabase
      .from("empresas")
      .select("id, razao_social, empresa_papeis!inner(papel)")
      .eq("empresa_papeis.papel", "fornecedor")
      .order("razao_social"),
    supabase.from("estoque_local").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("epis").select("id, descricao, ca").order("descricao"),
  ])

  const fornecedores = (fornecedoresRes.data ?? []).map((f) => ({
    id: f.id,
    razao_social: f.razao_social,
  }))

  return (
    <div className="container py-8 max-w-5xl">
      <CompraForm
        fornecedores={fornecedores}
        locais={locaisRes.data ?? []}
        epis={episRes.data ?? []}
        action={salvarCompra}
      />
    </div>
  )
}

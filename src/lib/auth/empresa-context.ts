import { createClient } from "@/lib/supabase/server"

/**
 * Contexto de empresa do usuário autenticado: quais empresas ele pode operar
 * (tabela `usuario_empresas`) e qual está ativa. Alimenta o seletor de empresa
 * no topo do app. Usuários com 1 empresa não veem o seletor.
 */
export type EmpresaOpcao = { id: string; razao_social: string }
export type EmpresaContexto = {
  empresas: EmpresaOpcao[]
  ativaId: string | null
}

export async function getEmpresasDoUsuario(): Promise<EmpresaContexto> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { empresas: [], ativaId: null }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("empresa_ativa_id, empresa_id")
    .eq("id", user.id)
    .maybeSingle()
  const u = usuario as { empresa_ativa_id?: string | null; empresa_id?: string | null } | null
  const ativaId = u?.empresa_ativa_id ?? u?.empresa_id ?? null

  // Só empresas próprias são contextos operáveis (switcháveis). Parceiros
  // (cliente/prestadora) nunca entram no seletor.
  const { data: vinculos } = await supabase
    .from("usuario_empresas")
    .select("empresa_id, empresas:empresa_id(razao_social, propria)")
    .eq("usuario_id", user.id)
    .eq("empresas.propria", true)

  const empresas: EmpresaOpcao[] = (vinculos ?? [])
    .map((v) => {
      const row = v as {
        empresa_id: string
        empresas?: { razao_social?: string; propria?: boolean | null } | null
      }
      return { id: row.empresa_id, razao_social: row.empresas?.razao_social ?? "—", propria: row.empresas?.propria }
    })
    .filter((e) => e.propria === true)
    .map((e) => ({ id: e.id, razao_social: e.razao_social }))
    .sort((a, b) => a.razao_social.localeCompare(b.razao_social, "pt-BR"))

  return { empresas, ativaId }
}

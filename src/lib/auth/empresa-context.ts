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

  const { data: vinculos } = await supabase
    .from("usuario_empresas")
    .select("empresa_id, empresas:empresa_id(razao_social)")
    .eq("usuario_id", user.id)

  const empresas: EmpresaOpcao[] = (vinculos ?? [])
    .map((v) => {
      const row = v as { empresa_id: string; empresas?: { razao_social?: string } | null }
      return { id: row.empresa_id, razao_social: row.empresas?.razao_social ?? "—" }
    })
    .sort((a, b) => a.razao_social.localeCompare(b.razao_social, "pt-BR"))

  return { empresas, ativaId }
}

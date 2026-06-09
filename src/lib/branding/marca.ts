import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Marca do produto = a empresa DONA do sistema (`empresas.dona_sistema = true`).
 *
 * Lida via service role (admin client) para funcionar inclusive na tela de
 * login — que é PRÉ-autenticação (sem sessão), onde não existe "empresa ativa"
 * e a RLS bloquearia uma leitura comum. Exposto apenas nome + logo (sem dados
 * sensíveis). Cacheada por request (`react.cache`).
 *
 * SÓ usar em Server Components / Server Actions / Route Handlers (usa o
 * service role). Em client components, receba `nome`/`logoUrl` por prop.
 *
 * Fallback neutro ("SST Manager", sem logo) quando não há dona, não há logo
 * cadastrada, ou em qualquer erro de leitura.
 */
export type Marca = { nome: string; logoUrl: string | null }

const PADRAO: Marca = { nome: "SST Manager", logoUrl: null }

export const getMarca = cache(async (): Promise<Marca> => {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("empresas")
      .select("razao_social, nome_fantasia, logo_url")
      .eq("dona_sistema", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    if (!data) return PADRAO
    const nome =
      (data.nome_fantasia as string | null)?.trim() ||
      (data.razao_social as string | null)?.trim() ||
      PADRAO.nome
    return { nome, logoUrl: (data.logo_url as string | null) ?? null }
  } catch {
    return PADRAO
  }
})

import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"

// `cache` é uma API de React Server Components; em ambiente de teste (fora do
// runtime RSC) pode não existir. Memoiza por request em produção; passthrough
// no teste — comportamento funcional idêntico.
const rscCache: <T extends (...args: never[]) => unknown>(fn: T) => T =
  typeof cache === "function" ? (cache as never) : ((fn) => fn)

/**
 * Marca e Organização do produto.
 *
 * A "Organização" é a conta dona desta instância (white-label, 1 deploy por
 * cliente) — um singleton na tabela `organizacao`. A marca (nome + logo) vem
 * DELA, de forma determinística (não mais "a empresa dona mais antiga").
 *
 * Lida via service role (admin client) para funcionar inclusive na tela de
 * login (PRÉ-autenticação, sem sessão, onde a RLS bloquearia leitura comum).
 * Exposto apenas dados de marca (sem nada sensível). Cacheado por request.
 *
 * SÓ usar em Server Components / Server Actions / Route Handlers. Em client
 * components, receba `nome`/`logoUrl` por prop.
 */
export type Marca = { nome: string; logoUrl: string | null }
export type Organizacao = {
  nome: string
  nomeFantasia: string | null
  logoUrl: string | null
  templateCertificado: string | null
}

const PADRAO: Marca = { nome: "SST Manager", logoUrl: null }

/** Organização (conta/marca) desta instância — singleton. Null se não houver. */
export const getOrganizacao = rscCache(async (): Promise<Organizacao | null> => {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("organizacao")
      .select("nome, nome_fantasia, logo_url, template_certificado")
      .limit(1)
      .maybeSingle()
    if (!data) return null
    return {
      nome: (data.nome as string | null)?.trim() || PADRAO.nome,
      nomeFantasia: (data.nome_fantasia as string | null) ?? null,
      logoUrl: (data.logo_url as string | null) ?? null,
      templateCertificado: (data.template_certificado as string | null) ?? null,
    }
  } catch {
    return null
  }
})

/** Marca (nome + logo) determinística, vinda da Organização. Fallback neutro. */
export const getMarca = rscCache(async (): Promise<Marca> => {
  const org = await getOrganizacao()
  if (!org) return PADRAO
  return { nome: org.nome, logoUrl: org.logoUrl }
})

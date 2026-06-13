/**
 * GET /api/integr/v1/estrutura/obras[?empresa_cnpj=<14 dígitos>]
 *
 * Lista as obras do SST para o Sistenge People amarrar cada obra a um Centro de
 * Resultado (CR) dele. O People é o CONSUMIDOR (pull) e persiste `id` como
 * `external_id_sst`, reconciliando por ele — então `id` é estável/imutável
 * (UUID da obra). `codigo` é o fallback de match.
 *
 * Auth: `Authorization: Bearer <PEOPLE_API_KEY>` (ou `x-api-key`) — mesmo
 * esquema das demais rotas /api/integr/v1/*. Sem key válida → 401.
 *
 * Contrato (NÃO mudar sem alinhar com o People): envelope `{ obras: [...] }`
 * com { id, codigo, nome, local, ativo }. Sempre o envelope, nunca array nu;
 * filtro que não casa nada → `{ obras: [] }` (não 404).
 */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verificarApiKeyPeople } from "@/lib/integracao/people/auth-leitura"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const soDigitos = (s: string) => s.replace(/\D/g, "")

/** Compõe "Cidade/UF" (ou cidade, ou null) para o campo `local`. */
function montarLocal(cidade: string | null, uf: string | null): string | null {
  if (cidade && uf) return `${cidade}/${uf}`
  return cidade || uf || null
}

export async function GET(req: Request) {
  if (!verificarApiKeyPeople(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const admin = createAdminClient()
  const cnpjParam = new URL(req.url).searchParams.get("empresa_cnpj")

  // Filtro opcional por empresa: resolve por CNPJ comparando só os dígitos
  // (ignora máscara). Sem empresa correspondente → envelope vazio, nunca 404.
  let empresaIds: string[] | null = null
  if (cnpjParam) {
    const alvo = soDigitos(cnpjParam)
    const { data: empresas } = await admin.from("empresas").select("id, cnpj")
    empresaIds = (empresas ?? [])
      .filter((e) => soDigitos(e.cnpj ?? "") === alvo)
      .map((e) => e.id as string)
    if (empresaIds.length === 0) return NextResponse.json({ obras: [] })
  }

  let query = admin.from("obras").select("id, codigo, nome, cidade, uf, ativa").order("nome")
  if (empresaIds) query = query.in("empresa_id", empresaIds)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const obras = (data ?? []).map((o) => ({
    id: o.id as string,
    codigo: o.codigo as string,
    nome: o.nome as string,
    local: montarLocal(o.cidade as string | null, o.uf as string | null),
    ativo: !!o.ativa,
  }))

  return NextResponse.json({ obras })
}

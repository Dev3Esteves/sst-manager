/**
 * GET /api/integr/v1/obras[?codigo=...&ativa=true]
 * Lista de obras (SST é a fonte de verdade) para o People (RH) reconciliar
 * seus `centros_responsabilidade` (tipo='obra') pelo CÓDIGO da obra.
 * Auth por API key (PEOPLE_API_KEY). Retorna também os locais de cada obra.
 */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verificarApiKeyPeople } from "@/lib/integracao/people/auth-leitura"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!verificarApiKeyPeople(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const url = new URL(req.url)
  const codigo = url.searchParams.get("codigo")
  const apenasAtivas = url.searchParams.get("ativa") !== "false"

  const admin = createAdminClient()
  let query = admin
    .from("obras")
    .select("id, codigo, nome, cnpj, cep, logradouro, numero, complemento, bairro, cidade, uf, empreitada, ativa, empresa_id, contratante_id, obra_locais(id, nome, tipo, ativo)")
    .order("nome")
  if (codigo) query = query.eq("codigo", codigo)
  if (apenasAtivas) query = query.eq("ativa", true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const itens = (data ?? []).map((o) => ({
    id: o.id,
    codigo: o.codigo,
    nome: o.nome,
    cnpj: o.cnpj,
    endereco: {
      cep: o.cep, logradouro: o.logradouro, numero: o.numero,
      complemento: o.complemento, bairro: o.bairro, cidade: o.cidade, uf: o.uf,
    },
    empreitada: o.empreitada,
    ativa: o.ativa,
    empresa_id: o.empresa_id,
    contratante_id: o.contratante_id,
    locais: (Array.isArray(o.obra_locais) ? o.obra_locais : []).map((l) => ({
      id: l.id, nome: l.nome, tipo: l.tipo, ativo: l.ativo,
    })),
  }))

  return NextResponse.json({ total: itens.length, itens })
}

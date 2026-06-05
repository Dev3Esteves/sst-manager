/**
 * GET /api/integr/v1/psicossocial/campanhas
 * Lista campanhas psicossociais para o Sistenge People (auth por API key).
 * Filtro opcional ?empresa_cnpj=. Retorna metadados, nunca respostas.
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
  const admin = createAdminClient()
  const cnpj = new URL(req.url).searchParams.get("empresa_cnpj")

  let empresaId: string | null = null
  if (cnpj) {
    const alvo = cnpj.replace(/\D/g, "")
    const { data: empresas } = await admin.from("empresas").select("id, cnpj")
    empresaId = (empresas ?? []).find((e) => (e.cnpj ?? "").replace(/\D/g, "") === alvo)?.id ?? null
    if (!empresaId) return NextResponse.json({ campanhas: [] })
  }

  let query = admin
    .from("psi_campanha")
    .select("id, titulo, status, versao_aplicada, data_inicio, data_fim, pgr(numero_revisao, obras(nome))")
    .order("created_at", { ascending: false })
  if (empresaId) query = query.eq("empresa_id", empresaId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const campanhas = (data ?? []).map((c) => {
    const pgr = Array.isArray(c.pgr) ? c.pgr[0] : c.pgr
    const obra = pgr ? (Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras) : null
    return {
      id: c.id,
      titulo: c.titulo,
      status: c.status,
      versao: c.versao_aplicada,
      data_inicio: c.data_inicio,
      data_fim: c.data_fim,
      obra: obra?.nome ?? null,
      pgr_revisao: pgr?.numero_revisao ?? null,
    }
  })
  return NextResponse.json({ campanhas })
}

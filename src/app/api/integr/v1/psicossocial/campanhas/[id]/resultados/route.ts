/**
 * GET /api/integr/v1/psicossocial/campanhas/[id]/resultados
 * Resultados AGREGADOS por GHE × dimensão para o People (RH).
 *
 * ⚠️ Anonimato: expõe apenas o agregado (score/classificação por GHE). NUNCA
 * respostas individuais (psi_resposta é deny-all e não é lida aqui).
 */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verificarApiKeyPeople } from "@/lib/integracao/people/auth-leitura"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarApiKeyPeople(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const { id } = await params
  const admin = createAdminClient()

  const { data: campanha } = await admin
    .from("psi_campanha").select("id, titulo, status, versao_aplicada").eq("id", id).maybeSingle()
  if (!campanha) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })

  const { data: res } = await admin
    .from("psi_resultado_dimensao")
    .select("pgr_ghe_id, dominio, dimensao_nome, score_risco, classificacao, n_respondentes, suprimido")
    .eq("campanha_id", id)

  return NextResponse.json({
    campanha: { id: campanha.id, titulo: campanha.titulo, status: campanha.status, versao: campanha.versao_aplicada },
    resultados: (res ?? []).map((r) => ({
      ghe_id: r.pgr_ghe_id,
      dominio: r.dominio,
      dimensao: r.dimensao_nome,
      score_risco: r.suprimido ? null : r.score_risco,
      classificacao: r.suprimido ? null : r.classificacao,
      n_respondentes: r.n_respondentes,
      suprimido: r.suprimido,
    })),
  })
}

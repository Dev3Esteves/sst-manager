/**
 * GET /api/integr/v1/psicossocial/campanhas/[id]/relatorio
 * Relatório psicossocial (PDF) para o People (RH) — versão Bearer.
 *
 * Mesma geração de PDF da rota de sessão (`/api/psicossocial/[id]/relatorio`),
 * mas autenticada por API key (verificarApiKeyPeople) e lendo via service role.
 *
 * ⚠️ Anonimato: o PDF só contém agregado por GHE × dimensão (respeita supressão
 * quando n < min_respondentes). Nunca expõe respostas individuais.
 */
import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createAdminClient } from "@/lib/supabase/admin"
import { verificarApiKeyPeople } from "@/lib/integracao/people/auth-leitura"
import { formatCNPJ } from "@/lib/validations/shared"
import {
  renderPsicossocialRelatorioPdf,
  type RelatorioGhe,
  type RelatorioResultado,
} from "@/lib/pdf/psicossocial-relatorio"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarApiKeyPeople(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const { id } = await params
  // Sem sessão: tudo via service role (a API key é a fronteira de confiança).
  const admin = createAdminClient()

  const { data: campanha } = await admin
    .from("psi_campanha")
    .select("titulo, versao_aplicada, data_inicio, data_fim, status, min_respondentes, empresa_id, pgr(numero_revisao, obras(nome))")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })

  const pgr = Array.isArray(campanha.pgr) ? campanha.pgr[0] : campanha.pgr
  const obra = pgr ? (Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras) : null

  const { data: empresa } = await admin
    .from("empresas")
    .select("razao_social, cnpj")
    .eq("id", campanha.empresa_id)
    .maybeSingle()

  const { data: convites } = await admin
    .from("psi_convite")
    .select("pgr_ghe_id, pgr_ghe(codigo, descricao, num_empregados_expostos)")
    .eq("campanha_id", id)

  const { data: respostas } = await admin.from("psi_resposta").select("pgr_ghe_id").eq("campanha_id", id)
  const countPorGhe = new Map<string, number>()
  for (const r of respostas ?? []) countPorGhe.set(r.pgr_ghe_id, (countPorGhe.get(r.pgr_ghe_id) ?? 0) + 1)

  const codigoPorGhe = new Map<string, string>()
  const ghes: RelatorioGhe[] = (convites ?? []).map((c) => {
    const g = Array.isArray(c.pgr_ghe) ? c.pgr_ghe[0] : c.pgr_ghe
    if (g) codigoPorGhe.set(c.pgr_ghe_id, g.codigo)
    return {
      codigo: g?.codigo ?? "GHE",
      descricao: g?.descricao ?? "—",
      numExpostos: g?.num_empregados_expostos ?? null,
      respondentes: countPorGhe.get(c.pgr_ghe_id) ?? 0,
    }
  })

  const { data: res } = await admin
    .from("psi_resultado_dimensao")
    .select("pgr_ghe_id, dominio, dimensao_nome, score_risco, classificacao, n_respondentes, suprimido")
    .eq("campanha_id", id)
  const resultados: RelatorioResultado[] = (res ?? []).map((r) => ({
    gheCodigo: codigoPorGhe.get(r.pgr_ghe_id) ?? "GHE",
    dominio: r.dominio,
    dimensao: r.dimensao_nome,
    score: r.score_risco as number | null,
    classificacao: r.classificacao as RelatorioResultado["classificacao"],
    n: r.n_respondentes,
    suprimido: r.suprimido,
  }))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const pdf = await renderPsicossocialRelatorioPdf(
    {
      empresaRazaoSocial: empresa?.razao_social ?? "—",
      empresaCnpj: empresa?.cnpj ? formatCNPJ(empresa.cnpj) : "—",
      obraNome: obra?.nome ?? "—",
      pgrRevisao: pgr?.numero_revisao ?? null,
      campanhaTitulo: campanha.titulo,
      versao: campanha.versao_aplicada,
      dataInicio: campanha.data_inicio,
      dataFim: campanha.data_fim,
      status: campanha.status,
      minRespondentes: campanha.min_respondentes,
      ghes,
      resultados,
    },
    appUrl,
    id,
  )

  const buffer = await renderToBuffer(pdf)
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="relatorio-psicossocial-${id.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}

import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatCNPJ } from "@/lib/validations/shared"
import {
  renderPsicossocialRelatorioPdf,
  type RelatorioGhe,
  type RelatorioResultado,
} from "@/lib/pdf/psicossocial-relatorio"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Campanha (RLS garante que é da empresa do usuário)
  const { data: campanha } = await supabase
    .from("psi_campanha")
    .select("titulo, versao_aplicada, data_inicio, data_fim, status, min_respondentes, empresa_id, pgr(numero_revisao, obras(nome)), psi_instrumento(nome)")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })

  const pgr = Array.isArray(campanha.pgr) ? campanha.pgr[0] : campanha.pgr
  const obra = pgr ? (Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras) : null
  const instr = Array.isArray(campanha.psi_instrumento) ? campanha.psi_instrumento[0] : campanha.psi_instrumento
  const instrumentoNome = instr?.nome ?? "Instrumento psicossocial"

  const { data: empresa } = await supabase
    .from("empresas")
    .select("razao_social, cnpj")
    .eq("id", campanha.empresa_id)
    .maybeSingle()

  // Convites → GHEs da campanha
  const { data: convites } = await supabase
    .from("psi_convite")
    .select("pgr_ghe_id, pgr_ghe(codigo, descricao, num_empregados_expostos)")
    .eq("campanha_id", id)

  // Adesão (respostas por GHE) — via service role (psi_resposta é deny-all)
  const admin = createAdminClient()
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

  // Resultados calculados
  const { data: res } = await supabase
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
      instrumentoNome,
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

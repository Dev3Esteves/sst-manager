import Link from "next/link"
import { notFound } from "next/navigation"
import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, FileDown } from "lucide-react"
import { AcoesCampanha, CopiarLink } from "./acoes"
import { AvaliacaoSeveridade, type ItemSeveridade } from "./avaliacao-severidade"
import { AnaliseQualitativa, type GheQualitativo, type TemaQualitativo } from "./analise-qualitativa"

export const dynamic = "force-dynamic"

const COR_CLASSE: Record<string, string> = {
  verde: "bg-status-regular text-white",
  amarelo: "bg-status-alerta text-white",
  vermelho: "bg-status-vencido text-white",
}

export default async function CampanhaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: campanha } = await supabase
    .from("psi_campanha")
    .select("id, titulo, status, versao_aplicada, data_inicio, data_fim, min_respondentes, modo_qualitativo, pgr(numero_revisao, obras(nome))")
    .eq("id", id)
    .maybeSingle()
  if (!campanha) notFound()

  const pgr = Array.isArray(campanha.pgr) ? campanha.pgr[0] : campanha.pgr
  const obra = pgr ? (Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras) : null

  const { data: convites } = await supabase
    .from("psi_convite")
    .select("token, pgr_ghe_id, pgr_ghe(codigo, descricao, num_empregados_expostos)")
    .eq("campanha_id", id)

  // Adesão (respostas por GHE) — via service role (RLS deny-all nas respostas)
  const admin = createAdminClient()
  const { data: respostas } = await admin.from("psi_resposta").select("pgr_ghe_id").eq("campanha_id", id)
  const countPorGhe = new Map<string, number>()
  for (const r of respostas ?? []) countPorGhe.set(r.pgr_ghe_id, (countPorGhe.get(r.pgr_ghe_id) ?? 0) + 1)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const convitesView = await Promise.all(
    (convites ?? []).map(async (c) => {
      const ghe = Array.isArray(c.pgr_ghe) ? c.pgr_ghe[0] : c.pgr_ghe
      const link = `${appUrl}/q/${c.token}`
      const qr = await QRCode.toDataURL(link, { width: 150, margin: 1 })
      return { link, qr, ghe, respostas: countPorGhe.get(c.pgr_ghe_id) ?? 0 }
    }),
  )

  const { data: resultados } = await supabase
    .from("psi_resultado_dimensao")
    .select("pgr_ghe_id, dimensao_id, dimensao_nome, score_risco, classificacao, suprimido, n_respondentes, probabilidade, severidade, exposicao, nivel_risco_nr1, tipo, nivel_desfecho")
    .eq("campanha_id", id)

  // Pesquisa qualitativa: respondentes (lotes distintos) por GHE + sínteses salvas.
  const modoQualitativo = (campanha as { modo_qualitativo?: string }).modo_qualitativo ?? "nenhum"
  const respQualPorGhe = new Map<string, Set<string>>()
  if (modoQualitativo !== "nenhum") {
    const { data: respQual } = await admin
      .from("psi_resposta_qualitativa")
      .select("pgr_ghe_id, lote_id")
      .eq("campanha_id", id)
    for (const r of respQual ?? []) {
      const s = respQualPorGhe.get(r.pgr_ghe_id) ?? new Set<string>()
      s.add(r.lote_id)
      respQualPorGhe.set(r.pgr_ghe_id, s)
    }
  }
  const { data: sinteses } = modoQualitativo !== "nenhum"
    ? await supabase
        .from("psi_sintese_qualitativa")
        .select("id, pgr_ghe_id, temas, alertas, sugestoes, verbatim_aprovado, revisado, atualizado_em")
        .eq("campanha_id", id)
    : { data: [] }

  // Monta heatmap: GHEs (linhas) × dimensões (colunas)
  const gheNome = new Map<string, string>()
  for (const c of convitesView) if (c.ghe) gheNome.set(c.ghe.codigo, c.ghe.descricao)
  const gheCodigoPorId = new Map<string, string>()
  for (const c of convites ?? []) {
    const ghe = Array.isArray(c.pgr_ghe) ? c.pgr_ghe[0] : c.pgr_ghe
    if (ghe) gheCodigoPorId.set(c.pgr_ghe_id, ghe.codigo)
  }
  const dimensoes = Array.from(new Set((resultados ?? []).map((r) => r.dimensao_nome)))
  const ghesComResultado = Array.from(new Set((resultados ?? []).map((r) => r.pgr_ghe_id)))
  const cell = new Map<string, { score: number | null; classe: string | null; suprimido: boolean }>()
  for (const r of resultados ?? []) {
    cell.set(`${r.pgr_ghe_id}::${r.dimensao_nome}`, {
      score: r.score_risco as number | null,
      classe: r.classificacao,
      suprimido: r.suprimido,
    })
  }
  const temResultados = (resultados ?? []).some((r) => !r.suprimido)

  // Itens para a avaliação técnica de severidade (NR-1): dimensões não suprimidas.
  const itensSeveridade: ItemSeveridade[] = (resultados ?? [])
    .filter((r) => !r.suprimido)
    .map((r) => ({
      pgr_ghe_id: r.pgr_ghe_id,
      gheCodigo: gheCodigoPorId.get(r.pgr_ghe_id) ?? "GHE",
      dimensao_id: r.dimensao_id,
      dimensao_nome: r.dimensao_nome,
      score: r.score_risco as number | null,
      probabilidade: r.probabilidade as number | null,
      severidade: r.severidade as number | null,
      exposicao: r.exposicao as number | null,
      nivel_risco_nr1: r.nivel_risco_nr1 as string | null,
      tipo: (r.tipo as "exposicao" | "desfecho" | null) ?? "exposicao",
      nivel_desfecho: r.nivel_desfecho as string | null,
    }))

  const qualGhes: GheQualitativo[] = modoQualitativo !== "nenhum"
    ? Array.from(respQualPorGhe.entries()).map(([gid, lotes]) => {
        const codigo = gheCodigoPorId.get(gid) ?? "GHE"
        const s = (sinteses ?? []).find((x) => x.pgr_ghe_id === gid) ?? null
        return {
          pgr_ghe_id: gid,
          codigo,
          descricao: gheNome.get(codigo) ?? "",
          respondentes: lotes.size,
          sintese: s
            ? {
                id: s.id as string,
                temas: (s.temas ?? []) as TemaQualitativo[],
                alertas: (s.alertas ?? []) as string[],
                sugestoes: (s.sugestoes ?? []) as string[],
                verbatim_aprovado: (s.verbatim_aprovado ?? []) as string[],
                revisado: !!s.revisado,
              }
            : null,
        }
      })
    : []

  return (
    <div className="container py-8 max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/psicossocial"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-xl">{campanha.titulo}</CardTitle>
              <CardDescription>
                {obra?.nome ?? "Obra"}{pgr ? ` · PGR rev ${pgr.numero_revisao}` : ""} · versão {campanha.versao_aplicada} · mín. {campanha.min_respondentes}/GHE
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{campanha.status}</Badge>
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/psicossocial/${id}/relatorio`} target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4" /> Relatório PDF
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AcoesCampanha id={id} status={campanha.status} temResultados={temResultados} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links / QR por GHE</CardTitle>
          <CardDescription>
            Distribua o link ou QR a cada GHE. As respostas são anônimas; a adesão é contada sem identificar quem respondeu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {convitesView.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Este PGR não tem GHEs cadastrados. Adicione GHEs ao PGR e recrie a campanha.
            </p>
          )}
          {convitesView.map((c, i) => (
            <div key={i} className="flex items-center gap-4 rounded-md border p-3 flex-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.qr} alt="QR do questionário" className="h-24 w-24 rounded border" />
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium">{c.ghe?.codigo} — {c.ghe?.descricao}</div>
                <div className="text-xs text-muted-foreground mb-1">
                  {c.respostas} resposta(s){c.ghe?.num_empregados_expostos ? ` de ${c.ghe.num_empregados_expostos} expostos` : ""}
                </div>
                <CopiarLink link={c.link} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {dimensoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapa de calor — risco por GHE × dimensão</CardTitle>
            <CardDescription>Verde/amarelo/vermelho = risco baixo/médio/alto. Cinza = suprimido (poucos respondentes).</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left bg-muted/50">GHE</th>
                  {dimensoes.map((d) => (
                    <th key={d} className="p-2 text-center bg-muted/50 font-medium">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ghesComResultado.map((gid) => (
                  <tr key={gid}>
                    <td className="p-2 font-medium bg-muted/30">{gheCodigoPorId.get(gid) ?? "GHE"}</td>
                    {dimensoes.map((d) => {
                      const v = cell.get(`${gid}::${d}`)
                      if (!v || v.suprimido) return <td key={d} className="p-2 text-center bg-muted text-muted-foreground">—</td>
                      return (
                        <td key={d} className={`p-2 text-center font-semibold border border-white ${COR_CLASSE[v.classe ?? ""] ?? ""}`}>
                          {v.score}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {itensSeveridade.length > 0 && (() => {
        const soDesfecho = itensSeveridade.every((i) => i.tipo === "desfecho")
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {soDesfecho ? "Indicadores de desfecho (monitoramento)" : "Avaliação técnica do nível de risco (NR-1)"}
              </CardTitle>
              <CardDescription>
                {soDesfecho
                  ? "Este instrumento mede desfechos (consequências). Os resultados servem ao monitoramento e não são lançados no Inventário do PGR."
                  : "Determine o nível pela matriz Probabilidade × Severidade (× Exposição). Obrigatório antes de lançar no PGR."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvaliacaoSeveridade id={id} itens={itensSeveridade} />
            </CardContent>
          </Card>
        )
      })()}

      {modoQualitativo !== "nenhum" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise qualitativa (perguntas abertas)</CardTitle>
            <CardDescription>
              Síntese temática por IA das respostas abertas, por GHE. De-identificada e suprimida
              quando há menos de {campanha.min_respondentes} respondentes. Trechos literais só entram
              no relatório após sua revisão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnaliseQualitativa
              campanhaId={id}
              minRespondentes={campanha.min_respondentes}
              ghes={qualGhes}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

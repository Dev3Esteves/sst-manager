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
    .select("id, titulo, status, versao_aplicada, data_inicio, data_fim, min_respondentes, pgr(numero_revisao, obras(nome))")
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
    .select("pgr_ghe_id, dimensao_nome, score_risco, classificacao, suprimido, n_respondentes")
    .eq("campanha_id", id)

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
    </div>
  )
}

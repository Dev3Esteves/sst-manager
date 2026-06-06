import Link from "next/link"
import { getAuth, getAuthWithRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, ShieldCheck, CheckCircle2, XCircle, Users } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"
import { COMPROMISSOS_52, type PoliticaInput } from "@/lib/validations/politica"
import { CienciaButton, PublicarButton } from "./politica-acoes"

const ROLES = ["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"] as const
const STATUS_LABEL: Record<string, string> = { rascunho: "Rascunho", vigente: "Vigente", substituida: "Substituída" }

export const dynamic = "force-dynamic"

export default async function PoliticaPage() {
  const ctx = await getAuth()
  if (!ctx) return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  const gestor = await getAuthWithRole(ROLES)

  const { data: politicas } = await ctx.supabase
    .from("politica_sst")
    .select("*")
    .order("numero_revisao", { ascending: false })

  const lista = politicas ?? []
  const vigente = lista.find((p) => p.status === "vigente") ?? null

  let jaCiente = false
  let totalCiencia = 0
  if (vigente) {
    const [{ data: minha }, { count }] = await Promise.all([
      ctx.supabase.from("politica_sst_ciencia").select("usuario_id").eq("politica_id", vigente.id).eq("usuario_id", ctx.user.id).maybeSingle(),
      ctx.supabase.from("politica_sst_ciencia").select("*", { count: "exact", head: true }).eq("politica_id", vigente.id),
    ])
    jaCiente = !!minha
    totalCiencia = count ?? 0
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7" /> Política de SST
          </h1>
          <p className="text-muted-foreground">Política de Segurança e Saúde no Trabalho (ISO 45001 — 5.2).</p>
        </div>
        {gestor && (
          <Button asChild><Link href="/politica/nova"><Plus className="h-4 w-4" />Nova revisão</Link></Button>
        )}
      </div>

      {!vigente && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma política vigente.{gestor ? " Crie uma revisão e publique-a." : " Aguarde a publicação pela direção/segurança."}
          </CardContent>
        </Card>
      )}

      {vigente && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{vigente.titulo}</CardTitle>
                <CardDescription>
                  Revisão {vigente.numero_revisao} · <Badge variant="regular">Vigente</Badge>
                  {vigente.data_publicacao && ` · publicada em ${formatDate(vigente.data_publicacao)}`}
                </CardDescription>
              </div>
              <CienciaButton politicaId={vigente.id} jaCiente={jaCiente} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{vigente.conteudo}</p>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">Compromissos (cláusula 5.2)</div>
              <ul className="space-y-1">
                {COMPROMISSOS_52.map((c) => {
                  const ok = vigente[c.campo as keyof PoliticaInput] as boolean
                  return (
                    <li key={c.campo} className="flex items-start gap-2 text-sm">
                      {ok ? <CheckCircle2 className="h-4 w-4 text-status-regular mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-status-vencido mt-0.5 shrink-0" />}
                      <span className={ok ? "" : "text-muted-foreground line-through"}>{c.label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {vigente.aprovado_por_nome && <span>Aprovada por: <strong className="text-foreground">{vigente.aprovado_por_nome}</strong>{vigente.aprovado_por_cargo ? ` (${vigente.aprovado_por_cargo})` : ""}</span>}
              <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {totalCiencia} ciência(s) registrada(s)</span>
              {vigente.publica && <Badge variant="outline">Disponível a partes interessadas</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {gestor && lista.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Revisões</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {lista.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <span className="text-sm font-medium">Rev. {p.numero_revisao} — {p.titulo}</span>
                  <Badge variant={p.status === "vigente" ? "regular" : p.status === "rascunho" ? "outline" : "secondary"} className="ml-2">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.status !== "vigente" && <PublicarButton id={p.id} />}
                  <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/politica/${p.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

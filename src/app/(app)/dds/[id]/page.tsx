import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { ArrowLeft, Download, MessageSquare, CheckCircle2, MinusCircle } from "lucide-react"

type DdsViewConteudo = {
  tema: string
  data_dds: string
  hora_inicio: string | null
  duracao_minutos: number
  local: string
  mediador_nome: string
  mediador_cargo: string | null
  topicos: string[]
  observacoes: string | null
  participantes: {
    nome: string
    cpf: string | null
    cargo: string | null
    assinatura_url: string | null
  }[]
  assinatura_mediador_url: string | null
}

export default async function DDSViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: dds } = await supabase
    .from("documentos_sst")
    .select("*, empresas(razao_social)")
    .eq("id", id)
    .eq("tipo", "dialogo_seguranca")
    .single()

  if (!dds) notFound()

  const c = dds.conteudo as DdsViewConteudo
  const empresa = Array.isArray(dds.empresas) ? dds.empresas[0] : dds.empresas

  const totalAssinados = c.participantes.filter((p) => p.assinatura_url).length

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dds"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
        <Button asChild>
          <Link href={`/api/documentos/${dds.id}/pdf`} target="_blank">
            <Download className="h-4 w-4" />Baixar PDF
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{c.tema}</CardTitle>
              <CardDescription className="mt-1">
                {formatDate(c.data_dds)}{c.hora_inicio ? ` às ${c.hora_inicio}` : ""} · {c.duracao_minutos} min · {c.local}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Empresa" value={empresa?.razao_social ?? "—"} />
          <Row label="Mediador" value={`${c.mediador_nome}${c.mediador_cargo ? ` — ${c.mediador_cargo}` : ""}`} />
          <Row label="Nº doc" value={<code className="text-xs">{String(dds.numero_sequencial).padStart(4, "0")}</code>} />
        </CardContent>
      </Card>

      {c.topicos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tópicos abordados</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {c.topicos.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">{i + 1}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {c.observacoes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{c.observacoes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Participantes ({c.participantes.length})</CardTitle>
              <CardDescription>
                {totalAssinados} de {c.participantes.length} assinaram
              </CardDescription>
            </div>
            <Badge variant={totalAssinados === c.participantes.length ? "regular" : "alerta"}>
              {totalAssinados === c.participantes.length ? "Completo" : "Parcial"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {c.participantes.map((p, i) => (
            <div key={i} className="flex items-center gap-3 border rounded-md p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{p.nome}</div>
                <div className="text-xs text-muted-foreground">
                  {p.cpf ?? "—"}{p.cargo ? ` · ${p.cargo}` : ""}
                </div>
              </div>
              <div className="shrink-0">
                {p.assinatura_url ? (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.assinatura_url} alt="Assinatura" className="h-10 rounded border bg-white" />
                    <CheckCircle2 className="h-4 w-4 text-status-regular" />
                  </div>
                ) : (
                  <MinusCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {c.assinatura_mediador_url && (
        <Card>
          <CardHeader><CardTitle className="text-base">Assinatura do mediador</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.assinatura_mediador_url} alt="Assinatura mediador" className="h-14 rounded border bg-white" />
              <div>
                <div className="font-medium text-sm">{c.mediador_nome}</div>
                <div className="text-xs text-muted-foreground">{c.mediador_cargo ?? "Mediador"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b pb-2 last:border-b-0 last:pb-0">
      <div className="w-32 text-muted-foreground">{label}</div>
      <div className="flex-1 font-medium">{value}</div>
    </div>
  )
}

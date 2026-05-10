import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, FileDown } from "lucide-react"

type Portaria = { texto?: string } | string
type Manual = { titulo: string; url: string }

type Nr = {
  numero: string
  titulo: string
  status: "vigente" | "revogada"
  data_atualizacao: string | null
  fonte_url: string
  fonte_status: "ok" | "partial" | "error"
  pdf_url: string | null
  ementa: string | null
  campo_aplicacao: string | null
  portarias_recentes: Portaria[]
  manuais_relacionados: Manual[]
  notas: string | null
}

export default async function NrDetailPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  const supabase = await createClient()
  const { data: nr } = await supabase
    .from("nr_catalog")
    .select("*")
    .eq("numero", numero)
    .single<Nr>()

  if (!nr) notFound()

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
          <Link href="/referencias/nrs">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao catálogo
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight font-mono">NR-{nr.numero}</h1>
              {nr.status === "vigente" ? (
                <Badge variant="outline">vigente</Badge>
              ) : (
                <Badge variant="secondary">revogada</Badge>
              )}
              {nr.fonte_status === "partial" && (
                <Badge variant="alerta" className="text-[10px]">dados parciais</Badge>
              )}
            </div>
            <h2 className="text-xl text-muted-foreground">{nr.titulo}</h2>
            {nr.data_atualizacao && (
              <p className="text-sm text-muted-foreground mt-1">
                Atualizada em {new Date(nr.data_atualizacao).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {nr.pdf_url && (
              <Button asChild>
                <a href={nr.pdf_url} target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4" />
                  PDF oficial
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href={nr.fonte_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Página gov.br
              </a>
            </Button>
          </div>
        </div>
      </div>

      {nr.ementa && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ementa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-line">{nr.ementa}</p>
          </CardContent>
        </Card>
      )}

      {nr.campo_aplicacao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campo de aplicação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-line">{nr.campo_aplicacao}</p>
          </CardContent>
        </Card>
      )}

      {nr.portarias_recentes && nr.portarias_recentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portarias / atualizações recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              {nr.portarias_recentes.map((p, i) => (
                <li key={i}>{typeof p === "string" ? p : p.texto}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {nr.manuais_relacionados && nr.manuais_relacionados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manuais e cartilhas relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1.5">
              {nr.manuais_relacionados.map((m, i) => (
                <li key={i}>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {m.titulo}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {nr.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {nr.notas}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

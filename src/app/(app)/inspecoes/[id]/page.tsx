import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import type { RespostaItem } from "@/lib/validations/inspecao"

function conformidadeVariant(p: number | null): BadgeProps["variant"] {
  if (p === null) return "secondary"
  if (p >= 90) return "regular"
  if (p >= 70) return "alerta"
  if (p >= 50) return "critico"
  return "vencido"
}

export default async function InspecaoViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: inspecao } = await supabase
    .from("inspecoes")
    .select("*, templates_inspecao(titulo, categoria), colaboradores(nome_completo), empresas(razao_social)")
    .eq("id", id).single()

  if (!inspecao) notFound()

  const tpl = Array.isArray(inspecao.templates_inspecao) ? inspecao.templates_inspecao[0] : inspecao.templates_inspecao
  const insp = Array.isArray(inspecao.colaboradores) ? inspecao.colaboradores[0] : inspecao.colaboradores
  const emp = Array.isArray(inspecao.empresas) ? inspecao.empresas[0] : inspecao.empresas
  const respostas = (inspecao.respostas as RespostaItem[]) ?? []

  const ncs = respostas.filter(r => r.conforme === "nao")

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inspecoes"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{tpl?.titulo ?? "Inspeção"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <KpiField label="Conformidade" value={
            <Badge variant={conformidadeVariant(inspecao.percentual_conformidade)} className="text-base">
              {inspecao.percentual_conformidade}%
            </Badge>
          } />
          <KpiField label="Data" value={formatDate(inspecao.data_inspecao)} />
          <KpiField label="Local" value={inspecao.local} />
          <KpiField label="Inspetor" value={insp?.nome_completo ?? "—"} />
          <KpiField label="Empresa" value={emp?.razao_social ?? "—"} />
          <KpiField label="Status" value={<Badge variant="outline">{inspecao.status}</Badge>} />
        </CardContent>
      </Card>

      {ncs.length > 0 && (
        <Card className="border-status-vencido">
          <CardHeader>
            <CardTitle className="text-base text-status-vencido">
              {ncs.length} não conformidade(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ncs.map((r, i) => (
              <div key={i} className="rounded border border-status-vencido/30 bg-status-vencido/5 p-3">
                <div className="text-xs text-muted-foreground">{r.grupo ?? "Geral"}</div>
                <div className="text-sm font-medium">{r.pergunta}</div>
                {r.observacao && <div className="text-sm text-muted-foreground mt-1">→ {r.observacao}</div>}
                {r.foto_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a href={r.foto_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={r.foto_url}
                      alt={`Evidência: ${r.pergunta}`}
                      className="mt-2 max-h-48 rounded-md border object-contain"
                    />
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Respostas ({respostas.length} itens)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {respostas.map((r, i) => (
            <div key={i} className="flex items-start gap-3 border-b pb-2 last:border-b-0">
              <RespostaIcon conforme={r.conforme} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{r.grupo ?? "Geral"}</div>
                <div className="text-sm">{r.pergunta}</div>
                {r.observacao && <div className="text-xs text-muted-foreground mt-1">{r.observacao}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {inspecao.observacoes_gerais && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observações gerais</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{inspecao.observacoes_gerais}</CardContent>
        </Card>
      )}
    </div>
  )
}

function KpiField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function RespostaIcon({ conforme }: { conforme: "sim" | "nao" | "na" }) {
  if (conforme === "sim") return <CheckCircle2 className="h-5 w-5 text-status-regular shrink-0" />
  if (conforme === "nao") return <XCircle className="h-5 w-5 text-status-vencido shrink-0" />
  return <MinusCircle className="h-5 w-5 text-muted-foreground shrink-0" />
}

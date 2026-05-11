import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { OCORRENCIA_TIPOS, GRAVIDADE_LABEL, type AcaoCorretiva, type InvestigacaoInput } from "@/lib/validations/ocorrencia"
import { ArrowLeft, AlertTriangle, FileCode, FileText, ShieldCheck } from "lucide-react"
import { InvestigacaoForm } from "./investigacao-form"
import { saveInvestigacao } from "../actions"
import { promoverOcorrenciaParaNc } from "../../nao-conformidades/actions"

function gravidadeVariant(g: string | null): BadgeProps["variant"] {
  switch (g) {
    case "fatal": case "grave": return "vencido"
    case "moderado": return "critico"
    case "leve": return "alerta"
    default: return "secondary"
  }
}

export default async function OcorrenciaViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: oc } = await supabase
    .from("ocorrencias")
    .select("*, colaboradores(nome_completo), empresas(razao_social)")
    .eq("id", id).single()

  if (!oc) notFound()

  const c = Array.isArray(oc.colaboradores) ? oc.colaboradores[0] : oc.colaboradores
  const investigacao = oc.investigacao as InvestigacaoInput | null
  const acoes = (oc.acoes_corretivas as AcaoCorretiva[] | null) ?? []

  const { data: ncLinked } = await supabase
    .from("nao_conformidades")
    .select("id, numero_sequencial, status")
    .eq("ocorrencia_id", id)
    .maybeSingle<{ id: string; numero_sequencial: number; status: string }>()

  const bindSave = saveInvestigacao.bind(null, id)
  async function bindPromover() {
    "use server"
    await promoverOcorrenciaParaNc(id)
  }
  const ehAcidente = ["acidente_tipico", "acidente_trajeto", "doenca_ocupacional"].includes(oc.tipo)

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ocorrencias"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
        <div className="flex items-center gap-2">
          {ehAcidente && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/api/ocorrencias/${id}/cat-xml?formato=txt`} target="_blank">
                  <FileText className="h-4 w-4" />Resumo CAT
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/api/ocorrencias/${id}/cat-xml`} target="_blank">
                  <FileCode className="h-4 w-4" />XML eSocial S-2210
                </Link>
              </Button>
            </>
          )}
          {ncLinked ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/nao-conformidades/${ncLinked.id}`}>
                <ShieldCheck className="h-4 w-4" />
                NC-{String(ncLinked.numero_sequencial).padStart(4, "0")}
              </Link>
            </Button>
          ) : (
            <form action={bindPromover}>
              <Button variant="outline" size="sm" type="submit">
                <ShieldCheck className="h-4 w-4" />
                Abrir NC formal
              </Button>
            </form>
          )}
          <Badge variant="outline" className="capitalize">{oc.status}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-status-alerta" />
                {OCORRENCIA_TIPOS[oc.tipo]} — Nº {String(oc.numero_sequencial).padStart(4, "0")}
              </CardTitle>
              <CardDescription>{formatDate(oc.data_ocorrencia)} · {oc.local}</CardDescription>
            </div>
            {oc.gravidade && (
              <Badge variant={gravidadeVariant(oc.gravidade)} className="text-base">{GRAVIDADE_LABEL[oc.gravidade]}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Descrição" value={<span className="whitespace-pre-wrap">{oc.descricao}</span>} />
          {c && <Row label="Envolvido" value={c.nome_completo} />}
          {oc.parte_corpo_atingida && <Row label="Parte atingida" value={oc.parte_corpo_atingida} />}
          {oc.natureza_lesao && <Row label="Natureza da lesão" value={oc.natureza_lesao} />}
          {oc.agente_causador && <Row label="Agente causador" value={oc.agente_causador} />}
          {oc.dias_afastamento != null && <Row label="Dias de afastamento" value={String(oc.dias_afastamento)} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investigação — 5 Porquês</CardTitle>
          <CardDescription>
            Método simples para chegar à causa raiz: pergunte &quot;por quê?&quot; cinco vezes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvestigacaoForm
            ocorrenciaId={id}
            inicial={investigacao}
            acoesIniciais={acoes}
            descricaoProblema={oc.descricao}
            action={bindSave}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b pb-2 last:border-b-0 last:pb-0">
      <div className="w-40 text-muted-foreground">{label}</div>
      <div className="flex-1 font-medium">{value}</div>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react"
import { gerarSinteseQualitativa, revisarSinteseQualitativa } from "../actions"

export type TemaQualitativo = { titulo: string; frequencia: number; resumo: string; exemplos: string[] }
export type SinteseView = {
  id: string
  temas: TemaQualitativo[]
  alertas: string[]
  sugestoes: string[]
  verbatim_aprovado: string[]
  revisado: boolean
}
export type GheQualitativo = {
  pgr_ghe_id: string
  codigo: string
  descricao: string
  respondentes: number
  sintese: SinteseView | null
}

export function AnaliseQualitativa({
  campanhaId,
  minRespondentes,
  ghes,
}: {
  campanhaId: string
  minRespondentes: number
  ghes: GheQualitativo[]
}) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function gerar() {
    setMsg(null); setErro(null)
    startTransition(async () => {
      const r = await gerarSinteseQualitativa(campanhaId)
      if (r && "error" in r) setErro(r.error)
      else if (r && "ok" in r) setMsg(`Síntese gerada para ${r.id} GHE(s).`)
    })
  }

  const totalRespondentes = ghes.reduce((s, g) => s + g.respondentes, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap rounded-md border bg-muted/30 p-3">
        <span className="text-xs text-muted-foreground">
          {totalRespondentes} resposta(s) aberta(s) recebida(s). A síntese usa IA, de-identifica e
          suprime GHE com menos de {minRespondentes} respondentes.
        </span>
        <Button type="button" size="sm" onClick={gerar} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar / atualizar síntese (IA)
        </Button>
      </div>
      {msg && <p className="text-xs text-status-regular">{msg}</p>}
      {erro && <p className="text-xs text-destructive">{erro}</p>}

      {ghes.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Nenhuma resposta aberta recebida ainda.</p>
      )}

      {ghes.map((g) => (
        <GheBloco key={g.pgr_ghe_id} ghe={g} minRespondentes={minRespondentes} campanhaId={campanhaId} />
      ))}
    </div>
  )
}

function GheBloco({
  ghe,
  minRespondentes,
  campanhaId,
}: {
  ghe: GheQualitativo
  minRespondentes: number
  campanhaId: string
}) {
  const [pending, startTransition] = useTransition()
  const suprimido = ghe.respondentes < minRespondentes
  const sint = ghe.sintese

  // Verbatim candidatos = todos os exemplos dos temas; pré-marca os já aprovados.
  const candidatos = sint ? sint.temas.flatMap((t) => t.exemplos) : []
  const [aprovados, setAprovados] = useState<Set<string>>(new Set(sint?.verbatim_aprovado ?? []))

  function toggle(ex: string) {
    setAprovados((prev) => {
      const n = new Set(prev)
      if (n.has(ex)) n.delete(ex); else n.add(ex)
      return n
    })
  }

  function salvarRevisao() {
    if (!sint) return
    startTransition(async () => {
      await revisarSinteseQualitativa(sint.id, campanhaId, Array.from(aprovados))
    })
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-medium text-sm">
          {ghe.codigo} — {ghe.descricao}
          <span className="ml-2 text-xs text-muted-foreground">{ghe.respondentes} respondente(s)</span>
        </div>
        {sint?.revisado && <Badge variant="regular" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Revisado</Badge>}
      </div>

      {suprimido ? (
        <p className="text-xs text-muted-foreground italic">
          Suprimido para preservar o anonimato (menos de {minRespondentes} respondentes).
        </p>
      ) : !sint ? (
        <p className="text-xs text-muted-foreground italic">Sem síntese ainda — clique em “Gerar síntese (IA)”.</p>
      ) : (
        <div className="space-y-3">
          {sint.temas.map((t, i) => (
            <div key={i} className="rounded border bg-card p-2">
              <div className="text-sm font-medium">{t.titulo} <span className="text-xs text-muted-foreground">({t.frequencia})</span></div>
              <p className="text-xs text-muted-foreground mt-0.5">{t.resumo}</p>
              {t.exemplos.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {t.exemplos.map((ex, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={aprovados.has(ex)}
                        onChange={() => toggle(ex)}
                        className="mt-0.5"
                        title="Aprovar este trecho para aparecer no relatório"
                      />
                      <span className="italic text-muted-foreground">“{ex}”</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {sint.alertas.length > 0 && (
            <div className="rounded border border-amber-300 bg-amber-50 p-2">
              <div className="flex items-center gap-1 text-xs font-medium text-amber-800">
                <ShieldAlert className="h-3.5 w-3.5" /> Possível identificação — revisar
              </div>
              <ul className="mt-1 list-disc pl-5 text-xs text-amber-800">
                {sint.alertas.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {sint.sugestoes.length > 0 && (
            <div className="text-xs">
              <div className="font-medium">Sugestões de ação:</div>
              <ul className="list-disc pl-5 text-muted-foreground">
                {sint.sugestoes.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={salvarRevisao} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Salvar revisão {candidatos.length > 0 ? `(${aprovados.size}/${candidatos.length} trechos)` : ""}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Marque os trechos liberados para o relatório. Sem revisão, nenhum verbatim é exibido.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

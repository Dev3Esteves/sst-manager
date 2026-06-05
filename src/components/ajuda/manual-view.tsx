import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Lightbulb, AlertTriangle } from "lucide-react"
import type { Manual, BlocoManual } from "@/lib/ajuda/tipos"

function Bloco({ bloco }: { bloco: BlocoManual }) {
  switch (bloco.tipo) {
    case "paragrafo":
      return <p className="text-sm text-muted-foreground leading-relaxed">{bloco.texto}</p>
    case "passos":
      return (
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {bloco.itens.map((it, i) => <li key={i}>{it}</li>)}
        </ol>
      )
    case "campos":
      return (
        <ul className="space-y-1.5 text-sm">
          {bloco.itens.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-medium">{c.campo}{c.obrigatorio && <span className="text-destructive"> *</span>}:</span>
              <span className="text-muted-foreground">{c.descricao}</span>
            </li>
          ))}
        </ul>
      )
    case "exemplo":
      return (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          {bloco.titulo && <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{bloco.titulo}</div>}
          <div className="whitespace-pre-wrap font-mono text-[13px]">{bloco.texto}</div>
        </div>
      )
    case "padrao":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-status-regular/40 bg-status-regular/5 p-3 text-sm">
            <div className="flex items-center gap-1.5 text-status-regular font-semibold mb-1"><CheckCircle2 className="h-4 w-4" /> Recomendado</div>
            <div className="whitespace-pre-wrap">{bloco.recomendado}</div>
          </div>
          <div className="rounded-md border border-status-vencido/40 bg-status-vencido/5 p-3 text-sm">
            <div className="flex items-center gap-1.5 text-status-vencido font-semibold mb-1"><XCircle className="h-4 w-4" /> Evite</div>
            <div className="whitespace-pre-wrap">{bloco.evitar}</div>
          </div>
        </div>
      )
    case "dica":
      return (
        <div className="flex gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <span>{bloco.texto}</span>
        </div>
      )
    case "atencao":
      return (
        <div className="flex gap-2 rounded-md border border-status-alerta/40 bg-status-alerta/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-status-alerta mt-0.5" />
          <span>{bloco.texto}</span>
        </div>
      )
  }
}

export function ManualView({ manual }: { manual: Manual }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{manual.titulo}</h1>
        <p className="text-muted-foreground mt-1">{manual.resumo}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {manual.perfis.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
        </div>
      </div>

      {manual.secoes.map((sec, i) => (
        <Card key={i}>
          <CardHeader><CardTitle className="text-base">{sec.titulo}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {sec.blocos.map((b, j) => <Bloco key={j} bloco={b} />)}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

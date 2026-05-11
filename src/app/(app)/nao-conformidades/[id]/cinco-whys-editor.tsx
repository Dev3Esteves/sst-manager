"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2 } from "lucide-react"

export type CincoWhysItem = {
  ordem: number
  pergunta: string
  resposta: string
  eh_causa_raiz: boolean
}

const DEFAULT_PERGUNTAS = [
  "Por quê aconteceu?",
  "Por quê isso aconteceu?",
  "Por quê isso aconteceu (3)?",
  "Por quê isso aconteceu (4)?",
  "Por quê isso aconteceu (5)?",
]

export function CincoWhysEditor({
  inicial,
  action,
}: {
  inicial: CincoWhysItem[]
  action: (itens: CincoWhysItem[]) => Promise<{ error?: { _form?: string[] } } | { ok: boolean } | void>
}) {
  const initial: CincoWhysItem[] = Array.from({ length: 5 }, (_, i) => {
    const ordem = i + 1
    const existing = inicial.find((it) => it.ordem === ordem)
    return (
      existing ?? {
        ordem,
        pergunta: DEFAULT_PERGUNTAS[i],
        resposta: "",
        eh_causa_raiz: false,
      }
    )
  })

  const [itens, setItens] = useState<CincoWhysItem[]>(initial)
  const [saved, setSaved] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function updateItem(i: number, patch: Partial<CincoWhysItem>) {
    setItens((p) =>
      p.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    )
    setSaved(false)
  }

  function marcarCausaRaiz(i: number) {
    setItens((p) =>
      p.map((it, idx) => ({ ...it, eh_causa_raiz: idx === i })),
    )
    setSaved(false)
  }

  function handleSave() {
    setErrMsg(null)
    startTransition(async () => {
      const result = await action(itens)
      if (result && "error" in result && result.error?._form) {
        setErrMsg(result.error._form[0])
        setSaved(false)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Para cada nível, pergunte <strong>&quot;por quê?&quot;</strong> sobre a resposta
        anterior. A causa raiz é a resposta marcada — geralmente a última, mas
        pode aparecer antes se já for uma causa actionable.
      </p>

      {itens.map((it, i) => (
        <div key={it.ordem} className="grid grid-cols-[32px_1fr] items-start gap-3">
          <div
            className={
              "mt-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold " +
              (it.eh_causa_raiz
                ? "bg-status-critico text-white"
                : "bg-primary text-primary-foreground")
            }
          >
            {it.ordem}
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Pergunta {it.ordem}
            </Label>
            <Input
              value={it.pergunta}
              onChange={(e) => updateItem(i, { pergunta: e.target.value })}
              placeholder={DEFAULT_PERGUNTAS[i]}
            />
            <Input
              value={it.resposta}
              onChange={(e) => updateItem(i, { resposta: e.target.value })}
              placeholder="Resposta…"
            />
            <button
              type="button"
              onClick={() => marcarCausaRaiz(i)}
              className={
                "text-xs " +
                (it.eh_causa_raiz
                  ? "text-status-critico font-semibold"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {it.eh_causa_raiz ? "✓ Marcado como causa raiz" : "Marcar como causa raiz"}
            </button>
          </div>
        </div>
      ))}

      {errMsg && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errMsg}
        </div>
      )}

      {saved && !errMsg && (
        <div className="flex items-center gap-2 rounded-md border border-status-regular bg-status-regular/10 p-2 text-xs text-status-regular">
          <CheckCircle2 className="h-4 w-4" />
          5 Porquês salvos.
        </div>
      )}

      <Button type="button" onClick={handleSave} disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar 5 Porquês
      </Button>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckCircle2, Loader2, ArrowRight, HelpCircle } from "lucide-react"
import { concluirComQuiz } from "../actions"

type Pergunta = { pergunta: string; opcoes: string[] }

export function QuizModulo({
  slug, perguntas, jaConcluido, nextSlug, returnTo = null,
}: {
  slug: string
  perguntas: Pergunta[]
  jaConcluido: boolean
  nextSlug: string | null
  returnTo?: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [respostas, setRespostas] = useState<(number | null)[]>(() => perguntas.map(() => null))

  function irAdiante() {
    router.push(returnTo ?? (nextSlug ? `/treinamento/${nextSlug}` : "/treinamento"))
    router.refresh()
  }

  function enviar() {
    if (respostas.some((r) => r === null)) { toast.error("Responda todas as perguntas."); return }
    startTransition(async () => {
      const r = await concluirComQuiz(slug, respostas as number[])
      if ("error" in r) { toast.error(r.error); return }
      toast.success("Quiz aprovado! Módulo concluído.")
      irAdiante()
    })
  }

  if (jaConcluido) {
    return (
      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <span className="inline-flex items-center gap-1.5 text-sm text-status-regular font-medium">
          <CheckCircle2 className="h-4 w-4" /> Módulo concluído
        </span>
        {returnTo
          ? <Button variant="outline" onClick={() => { router.push(returnTo); router.refresh() }}>Voltar ao recurso <ArrowRight className="h-4 w-4" /></Button>
          : nextSlug && <Button variant="outline" onClick={() => router.push(`/treinamento/${nextSlug}`)}>Próximo módulo <ArrowRight className="h-4 w-4" /></Button>}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="h-4 w-4" /> Quiz — responda para concluir
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-muted-foreground">Acerte todas as perguntas para liberar o uso deste módulo.</p>
        {perguntas.map((q, qi) => (
          <div key={qi} className="space-y-2">
            <div className="text-sm font-medium">{qi + 1}. {q.pergunta}</div>
            <div className="space-y-1.5">
              {q.opcoes.map((op, oi) => {
                const selecionada = respostas[qi] === oi
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setRespostas((prev) => prev.map((v, i) => (i === qi ? oi : v)))}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      selecionada ? "border-primary bg-primary/5" : "hover:bg-accent",
                    )}
                  >
                    <span className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      selecionada ? "border-primary" : "border-muted-foreground/40",
                    )}>
                      {selecionada && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    {op}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <Button onClick={enviar} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Enviar respostas e concluir
        </Button>
      </CardContent>
    </Card>
  )
}

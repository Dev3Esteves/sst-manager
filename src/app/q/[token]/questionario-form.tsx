"use client"

import { useState, useTransition } from "react"
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react"
import { ESCALA_LIKERT } from "@/lib/psicossocial/copsoq"
import { FAIXAS_ETARIAS, SEXOS } from "@/lib/validations/psicossocial"
import { submeterResposta } from "./actions"

type Item = { id: string; dominio: string; dimensao: string; texto: string; reverso: boolean }

export function QuestionarioForm({
  token,
  titulo,
  itens,
}: {
  token: string
  titulo: string
  itens: Item[]
}) {
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [faixaEtaria, setFaixaEtaria] = useState<string>("")
  const [sexo, setSexo] = useState<string>("")
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pending, startTransition] = useTransition()

  const total = itens.length
  const respondidos = Object.keys(respostas).length

  function enviar() {
    setErro(null)
    if (respondidos < total) {
      setErro(`Responda todas as ${total} perguntas (${respondidos}/${total}).`)
      return
    }
    startTransition(async () => {
      const r = await submeterResposta({
        token,
        faixa_etaria: (faixaEtaria || null) as never,
        sexo: (sexo || null) as never,
        itens: itens.map((it) => ({ item_id: it.id, valor: respostas[it.id] })),
      })
      if (r.ok) setEnviado(true)
      else setErro(r.error)
    })
  }

  if (enviado) {
    return (
      <div className="mt-10 rounded-lg border bg-background p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-status-regular" />
        <h1 className="mt-3 text-lg font-semibold">Resposta registrada. Obrigado!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua participação é anônima e ajuda a melhorar as condições de trabalho.
          Você já pode fechar esta página.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      <div className="rounded-md border border-status-regular/30 bg-status-regular/5 p-3 text-sm flex gap-2">
        <ShieldCheck className="h-5 w-5 text-status-regular shrink-0" />
        <span>
          <b>Anônimo.</b> Suas respostas não são identificadas. Os resultados só aparecem
          agregados por grupo, conforme a NR-01 e a LGPD.
        </span>
      </div>

      <div className="rounded-lg border bg-background p-4">
        <h1 className="font-semibold">{titulo}</h1>
        <p className="text-sm text-muted-foreground">
          Pense nas suas condições de trabalho nas últimas semanas e marque a frequência.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            Faixa etária (opcional)
            <select
              value={faixaEtaria}
              onChange={(e) => setFaixaEtaria(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {FAIXAS_ETARIAS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Sexo (opcional)
            <select
              value={sexo}
              onChange={(e) => setSexo(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {SEXOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {itens.map((it, idx) => (
        <div key={it.id} className="rounded-lg border bg-background p-4">
          <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">{it.dominio}</div>
          <p className="mt-1 text-sm font-medium">{idx + 1}. {it.texto}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ESCALA_LIKERT.rotulos.map((rot, i) => {
              const valor = ESCALA_LIKERT.valores[i]
              const ativo = respostas[it.id] === valor
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRespostas((p) => ({ ...p, [it.id]: valor }))}
                  className={`rounded-md border px-2 py-2 text-xs transition-colors ${
                    ativo ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary"
                  }`}
                >
                  {rot}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {erro && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mb-2 text-xs text-muted-foreground">{respondidos}/{total} respondidas</div>
        <button
          type="button"
          onClick={enviar}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar respostas
        </button>
      </div>
    </div>
  )
}

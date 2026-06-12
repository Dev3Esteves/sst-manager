"use client"

import { useState, useTransition } from "react"
import { Loader2, CheckCircle2, ShieldCheck, FileText } from "lucide-react"
import { FAIXAS_ETARIAS, SEXOS } from "@/lib/validations/psicossocial"
import { submeterResposta, registrarRecusa } from "./actions"

type Item = { id: string; dominio: string; dimensao: string; texto: string; reverso: boolean }
type Escala = { rotulos: string[]; valores: number[] }

export function QuestionarioForm({
  token,
  titulo,
  itens,
  escala,
  instrucao,
}: {
  token: string
  titulo: string
  itens: Item[]
  escala: Escala
  instrucao: string
}) {
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [faixaEtaria, setFaixaEtaria] = useState<string>("")
  const [sexo, setSexo] = useState<string>("")
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pending, startTransition] = useTransition()
  // Termo de consentimento (NR-01 + LGPD): respondente decide antes de responder.
  const [consentido, setConsentido] = useState(false)
  const [recusado, setRecusado] = useState(false)
  const [motivo, setMotivo] = useState("")

  function recusar() {
    setErro(null)
    startTransition(async () => {
      const r = await registrarRecusa({ token, motivo: motivo || null })
      if (r.ok) setRecusado(true)
      else setErro(r.error)
    })
  }

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

  if (recusado) {
    return (
      <div className="mt-10 rounded-lg border bg-background p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Tudo bem. Sua decisão foi registrada.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A participação é voluntária. Registramos apenas que houve uma recusa (de forma
          anônima), sem qualquer identificação. Você já pode fechar esta página.
        </p>
      </div>
    )
  }

  if (!consentido) {
    return (
      <div className="space-y-4 py-4">
        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Termo de consentimento</h1>
          </div>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              Você está sendo convidado(a) a participar de uma avaliação de <b>fatores
              psicossociais relacionados ao trabalho</b> (NR-01), aplicada ao seu grupo de
              trabalho. A avaliação mede <b>condições de trabalho</b>, não sintomas individuais.
            </p>
            <p>
              A participação é <b>voluntária e anônima</b>: suas respostas não são identificadas
              e os resultados só são apresentados de forma agregada por grupo (mínimo de
              respondentes), em conformidade com a NR-01 e a LGPD. Você pode não concordar sem
              qualquer prejuízo.
            </p>
          </div>
          <label className="mt-3 block text-sm">
            Motivo (opcional, caso não concorde)
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              placeholder="Se quiser, registre um motivo. É anônimo."
            />
          </label>
          {erro && (
            <div className="mt-3 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => { setErro(null); setConsentido(true) }}
              className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              Li e concordo — quero participar
            </button>
            <button
              type="button"
              onClick={recusar}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Não concordo
            </button>
          </div>
        </div>
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
        <p className="text-sm text-muted-foreground">{instrucao}</p>
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
            {escala.rotulos.map((rot, i) => {
              const valor = escala.valores[i]
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

"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react"
import type { AcaoCorretiva, InvestigacaoInput } from "@/lib/validations/ocorrencia"

type FormErrors = { _form?: string[] }

export function InvestigacaoForm({
  inicial, acoesIniciais, descricaoProblema, action,
}: {
  /** Reservado para futuro uso (ex.: logging da investigação) */
  ocorrenciaId?: string
  inicial: InvestigacaoInput | null
  acoesIniciais: AcaoCorretiva[]
  descricaoProblema: string
  action: (payload: InvestigacaoInput) => Promise<{ error?: FormErrors; ok?: boolean } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const [problema, setProblema] = useState(inicial?.problema ?? descricaoProblema.slice(0, 200))
  const [porques, setPorques] = useState<string[]>(inicial?.porques ?? ["", "", "", "", ""])
  const [causaRaiz, setCausaRaiz] = useState(inicial?.causa_raiz ?? "")
  const [acoes, setAcoes] = useState<AcaoCorretiva[]>(
    inicial?.acoes_corretivas ?? acoesIniciais.length > 0 ? acoesIniciais : [
      { descricao: "", responsavel: "", prazo: "", status: "pendente" },
    ]
  )

  function updatePorque(i: number, v: string) {
    setPorques((p) => p.map((x, idx) => (idx === i ? v : x)))
  }
  function addAcao() {
    setAcoes((p) => [...p, { descricao: "", responsavel: "", prazo: "", status: "pendente" }])
  }
  function updateAcao(i: number, patch: Partial<AcaoCorretiva>) {
    setAcoes((p) => p.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))
  }
  function removeAcao(i: number) {
    setAcoes((p) => p.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    const payload: InvestigacaoInput = {
      metodo: "cinco_porques",
      problema,
      porques,
      causa_raiz: causaRaiz,
      acoes_corretivas: acoes,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result && "error" in result && result.error) {
        setErrors(result.error)
        setSaved(false)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="problema">Problema / situação</Label>
        <textarea
          id="problema" value={problema} onChange={(e) => setProblema(e.target.value)}
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label>Os 5 Porquês</Label>
        {porques.map((p, i) => (
          <div key={i} className="grid grid-cols-[32px_1fr] items-start gap-3">
            <div className="mt-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {i + 1}
            </div>
            <div className="space-y-1">
              <Input
                value={p} onChange={(e) => updatePorque(i, e.target.value)}
                placeholder={`Por quê ${i + 1}? ${i === 0 ? "(aconteceu)" : "(isso acontece)"}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border-2 border-dashed border-status-critico/40 bg-status-critico/5 p-4">
        <Label htmlFor="raiz" className="text-status-critico font-semibold">Causa raiz identificada *</Label>
        <textarea
          id="raiz" value={causaRaiz} onChange={(e) => setCausaRaiz(e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="A causa raiz é a resposta ao 5º porquê — é sobre ela que as ações corretivas devem atuar."
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Ações corretivas</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAcao}>
            <Plus className="h-4 w-4" /> Ação
          </Button>
        </div>
        {acoes.map((a, i) => (
          <div key={i} className="rounded-md border p-3 space-y-2">
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <Input
                value={a.descricao} onChange={(e) => updateAcao(i, { descricao: e.target.value })}
                placeholder="O que será feito?"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeAcao(i)} disabled={acoes.length === 1} aria-label="Remover ação corretiva">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                value={a.responsavel} onChange={(e) => updateAcao(i, { responsavel: e.target.value })}
                placeholder="Responsável"
              />
              <Input
                type="date" value={a.prazo}
                onChange={(e) => updateAcao(i, { prazo: e.target.value })}
              />
              <Select value={a.status} onValueChange={(v) => updateAcao(i, { status: v as AcaoCorretiva["status"] })}>
                <SelectTrigger aria-label="Status da ação corretiva"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      {saved && !errors._form && (
        <div className="flex items-center gap-2 rounded-md border border-status-regular bg-status-regular/10 p-3 text-sm text-status-regular">
          <CheckCircle2 className="h-4 w-4" />
          Investigação salva.
        </div>
      )}

      <Button type="button" onClick={handleSave} disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar investigação
      </Button>
    </div>
  )
}

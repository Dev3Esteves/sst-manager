"use client"

import Link from "next/link"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SignatureCanvas } from "@/components/signature-canvas"
import { Loader2, ShieldAlert, CheckCircle2, XCircle } from "lucide-react"
import { PT_CHECKLIST, PT_TIPOS, PT_TIPO_LABEL, type PtTipo, type PtRespostaItem } from "@/lib/validations/pt"
import type { PtPayload } from "../../actions"

type Empresa = { id: string; razao_social: string }
type FormErrors = { _form?: string[] }

export function PtForm({
  tipo: tipoInicial, empresas, action,
}: {
  tipo: PtTipo
  empresas: Empresa[]
  action: (payload: PtPayload) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState<PtTipo>(tipoInicial)
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id || "")
  const [local, setLocal] = useState("")
  const [tarefa, setTarefa] = useState("")
  const [dataEmissao, setDataEmissao] = useState(hojeBrasilia())
  const [horaInicio, setHoraInicio] = useState("08:00")
  const [horaFim, setHoraFim] = useState("17:00")
  const [solicitante, setSolicitante] = useState("")
  const [executante, setExecutante] = useState("")
  const [aprovador, setAprovador] = useState("")
  const [medidas, setMedidas] = useState("")
  const [sigSol, setSigSol] = useState<string | null>(null)
  const [sigExec, setSigExec] = useState<string | null>(null)
  const [sigApr, setSigApr] = useState<string | null>(null)

  const [checklist, setChecklist] = useState<PtRespostaItem[]>(() =>
    PT_CHECKLIST[tipoInicial].map(i => ({ item_id: i.id, label: i.label, conforme: false, observacao: null }))
  )

  function changeTipo(novo: PtTipo) {
    setTipo(novo)
    setChecklist(PT_CHECKLIST[novo].map(i => ({ item_id: i.id, label: i.label, conforme: false, observacao: null })))
  }
  function toggleItem(i: number, conforme: boolean) {
    setChecklist(prev => prev.map((x, idx) => idx === i ? { ...x, conforme } : x))
  }
  function updateObs(i: number, observacao: string) {
    setChecklist(prev => prev.map((x, idx) => idx === i ? { ...x, observacao } : x))
  }

  const totalConformes = checklist.filter(c => c.conforme).length
  const podeLiberar = totalConformes === checklist.length

  function handleSubmit() {
    const payload: PtPayload = {
      tipo,
      empresa_id: empresaId,
      local_trabalho: local,
      descricao_tarefa: tarefa,
      data_emissao: dataEmissao,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      solicitante,
      executante,
      aprovador,
      checklist,
      medidas_especificas: medidas || null,
      assinatura_solicitante_data_url: sigSol ?? undefined,
      assinatura_executante_data_url: sigExec ?? undefined,
      assinatura_aprovador_data_url: sigApr ?? undefined,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissão de Trabalho</h1>
        <p className="text-muted-foreground">Checklist pré-trabalho varia conforme o tipo selecionado.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Tipo de PT</CardTitle>
          <CardDescription>Altere e os itens do checklist mudam automaticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            {PT_TIPOS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => changeTipo(t)}
                className={`rounded-md border p-3 text-left text-sm transition-colors ${
                  tipo === t ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-accent"
                }`}
              >
                <div className="font-medium">{PT_TIPO_LABEL[t]}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">2. Identificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local *</Label>
            <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Sala elétrica 03" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tarefa">Descrição da tarefa *</Label>
            <textarea
              id="tarefa" value={tarefa} onChange={(e) => setTarefa(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ex: Substituição de disjuntor principal do QGBT desenergizado"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="de">Data *</Label>
            <Input id="de" type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="hi">Início *</Label>
              <Input id="hi" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hf">Fim *</Label>
              <Input id="hf" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sol">Solicitante *</Label>
            <Input id="sol" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exec">Executante *</Label>
            <Input id="exec" value={executante} onChange={(e) => setExecutante(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="apr">Aprovador (responsável SST) *</Label>
            <Input id="apr" value={aprovador} onChange={(e) => setAprovador(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className={podeLiberar ? "border-status-regular" : "border-status-alerta"}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">3. Checklist pré-trabalho</CardTitle>
              <CardDescription>Todos os itens precisam estar conformes para liberar a PT.</CardDescription>
            </div>
            <div className="text-sm font-bold">
              {totalConformes}/{checklist.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist.map((c, i) => (
            <div key={c.item_id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm flex-1">{i + 1}. {c.label}</p>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleItem(i, true)}
                    className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium ${
                      c.conforme ? "bg-status-regular text-white border-status-regular" : "hover:bg-status-regular/10"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Conforme
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(i, false)}
                    className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium ${
                      !c.conforme ? "bg-status-vencido text-white border-status-vencido" : "hover:bg-status-vencido/10"
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" /> NC
                  </button>
                </div>
              </div>
              {!c.conforme && (
                <textarea
                  value={c.observacao ?? ""}
                  onChange={(e) => updateObs(i, e.target.value)}
                  rows={1}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Descreva a pendência"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">4. Medidas específicas</CardTitle></CardHeader>
        <CardContent>
          <textarea
            value={medidas} onChange={(e) => setMedidas(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Procedimentos adicionais específicos para esta tarefa"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">5. Assinaturas</CardTitle></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-sm font-medium mb-2">Solicitante</div>
            <SignatureCanvas onChange={setSigSol} />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Executante</div>
            <SignatureCanvas onChange={setSigExec} />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Aprovador</div>
            <SignatureCanvas onChange={setSigApr} />
          </div>
        </CardContent>
      </Card>

      {!podeLiberar && (
        <div className="rounded-md border border-status-alerta bg-status-alerta/10 p-3 text-sm flex gap-2 items-start">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            Existem pendências no checklist. A PT pode ser emitida como &quot;registro&quot; mas não libera o trabalho até todos os itens ficarem conformes.
          </div>
        </div>
      )}

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/documentos/new">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !local || !tarefa}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Emitir PT
        </Button>
      </div>
    </div>
  )
}

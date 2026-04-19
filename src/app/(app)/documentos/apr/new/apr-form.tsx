"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SignatureCanvas } from "@/components/signature-canvas"
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react"
import type { AprInput } from "@/lib/validations/documento"
import { toast } from "sonner"

type Empresa = { id: string; razao_social: string }
type Colaborador = { id: string; nome_completo: string }
type AprPayload = AprInput & { assinaturas?: { nome: string; papel: string; assinatura_data_url?: string }[] }
type FormErrors = { _form?: string[] }

type RiscoLocal = {
  atividade: string
  perigo: string
  consequencia: string
  probabilidade: number
  severidade: number
  medida_controle: string
  responsavel: string
}

const riscoColor = (p: number, s: number) => {
  const score = p * s
  if (score >= 15) return { label: "Crítico", bg: "bg-status-vencido text-white" }
  if (score >= 9) return { label: "Alto", bg: "bg-status-critico text-white" }
  if (score >= 4) return { label: "Moderado", bg: "bg-status-alerta text-black" }
  return { label: "Baixo", bg: "bg-status-regular text-white" }
}

export function AprForm({
  empresas, colaboradores, action,
}: {
  empresas: Empresa[]
  colaboradores: Colaborador[]
  action: (payload: AprPayload) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()

  const [empresaId, setEmpresaId] = useState(empresas[0]?.id || "")
  const [localTrabalho, setLocalTrabalho] = useState("")
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().slice(0, 10))
  const [dataValidade, setDataValidade] = useState("")
  const [equipe, setEquipe] = useState<string[]>([])
  const [episRaw, setEpisRaw] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [riscos, setRiscos] = useState<RiscoLocal[]>([
    { atividade: "", perigo: "", consequencia: "", probabilidade: 3, severidade: 3, medida_controle: "", responsavel: "" },
  ])
  const [iaLoading, setIaLoading] = useState<Record<number, boolean>>({})
  const [assinaturaResp, setAssinaturaResp] = useState<string | null>(null)

  async function sugerirIA(i: number) {
    const r = riscos[i]
    if (!r.atividade || r.atividade.length < 3 || !r.perigo || r.perigo.length < 3) {
      toast.warning("Preencha atividade e perigo (≥3 caracteres) antes de pedir sugestão.")
      return
    }
    setIaLoading((prev) => ({ ...prev, [i]: true }))
    try {
      const res = await fetch("/api/ia/classificar-risco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atividade: r.atividade, perigo: r.perigo }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503) {
          toast.error(data.error, { description: data.detail })
        } else {
          toast.error(data.error || "Falha ao sugerir risco")
        }
        return
      }
      updateRisco(i, {
        probabilidade: data.probabilidade,
        severidade: data.severidade,
        consequencia: data.consequencia,
        medida_controle: data.medida_controle,
      })
      toast.success("Sugestão aplicada", {
        description: data.justificativa || `P=${data.probabilidade} × S=${data.severidade}`,
      })
    } catch (err) {
      toast.error("Erro de rede ao consultar IA", {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIaLoading((prev) => ({ ...prev, [i]: false }))
    }
  }

  function updateRisco(i: number, patch: Partial<RiscoLocal>) {
    setRiscos((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function addRisco() {
    setRiscos((p) => [...p, { atividade: "", perigo: "", consequencia: "", probabilidade: 3, severidade: 3, medida_controle: "", responsavel: "" }])
  }
  function removeRisco(i: number) {
    setRiscos((p) => p.filter((_, idx) => idx !== i))
  }

  function handleSubmit() {
    const epis = episRaw.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
    const equipeNomes = equipe.map(id => colaboradores.find(c => c.id === id)?.nome_completo).filter((n): n is string => !!n)

    const payload: AprPayload = {
      empresa_id: empresaId,
      local_trabalho: localTrabalho,
      data_emissao: dataEmissao,
      data_validade: dataValidade || null,
      equipe: equipeNomes,
      riscos,
      epis,
      observacoes: observacoes || null,
      assinaturas: assinaturaResp
        ? [{ nome: "Responsável pela APR", papel: "Elaborador", assinatura_data_url: assinaturaResp }]
        : [],
    }

    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  function toggleEquipe(id: string) {
    setEquipe((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova APR</h1>
        <p className="text-muted-foreground">Análise Preliminar de Risco — matriz 5×5.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">1. Identificação</CardTitle></CardHeader>
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
            <Label htmlFor="local">Local do trabalho *</Label>
            <Input id="local" value={localTrabalho} onChange={(e) => setLocalTrabalho(e.target.value)} placeholder="Ex: Subestação 13,8kV — Data Center ABC" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="de">Data de emissão *</Label>
            <Input id="de" type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dv">Validade</Label>
            <Input id="dv" type="date" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Equipe participante</CardTitle>
          <CardDescription>Marque os colaboradores envolvidos na atividade.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1.5 md:grid-cols-2 max-h-64 overflow-y-auto">
            {colaboradores.map(c => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-accent">
                <input type="checkbox" checked={equipe.includes(c.id)} onChange={() => toggleEquipe(c.id)} className="h-4 w-4" />
                {c.nome_completo}
              </label>
            ))}
            {colaboradores.length === 0 && <p className="text-sm text-muted-foreground">Nenhum colaborador ativo.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">3. Matriz de Riscos (P × S)</CardTitle>
            <CardDescription>P = Probabilidade (1-5), S = Severidade (1-5)</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addRisco}>
            <Plus className="h-4 w-4" />Risco
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {riscos.map((r, i) => {
            const cls = riscoColor(r.probabilidade, r.severidade)
            return (
              <div key={i} className="grid gap-2 md:grid-cols-12 rounded-md border p-3">
                <div className="md:col-span-12 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Risco {i + 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sugerirIA(i)}
                    disabled={iaLoading[i]}
                    className="h-7 text-xs"
                  >
                    {iaLoading[i]
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Sparkles className="h-3.5 w-3.5" />
                    }
                    Sugerir com IA
                  </Button>
                </div>
                <div className="md:col-span-3 space-y-1">
                  <Label className="text-xs">Atividade / Perigo</Label>
                  <Input value={r.atividade} onChange={(e) => updateRisco(i, { atividade: e.target.value })} placeholder="Atividade" className="h-8" />
                  <Input value={r.perigo} onChange={(e) => updateRisco(i, { perigo: e.target.value })} placeholder="Perigo" className="h-8" />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <Label className="text-xs">Consequência</Label>
                  <Input value={r.consequencia} onChange={(e) => updateRisco(i, { consequencia: e.target.value })} className="h-8" />
                </div>
                <div className="md:col-span-1 space-y-1">
                  <Label className="text-xs">P</Label>
                  <Input type="number" min="1" max="5" value={r.probabilidade} onChange={(e) => updateRisco(i, { probabilidade: +e.target.value })} className="h-8" />
                </div>
                <div className="md:col-span-1 space-y-1">
                  <Label className="text-xs">S</Label>
                  <Input type="number" min="1" max="5" value={r.severidade} onChange={(e) => updateRisco(i, { severidade: +e.target.value })} className="h-8" />
                </div>
                <div className="md:col-span-1 flex items-end justify-center">
                  <span className={`inline-flex h-8 w-full items-center justify-center rounded text-xs font-bold ${cls.bg}`}>
                    {cls.label}
                  </span>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Medida de controle</Label>
                  <Input value={r.medida_controle} onChange={(e) => updateRisco(i, { medida_controle: e.target.value })} className="h-8" />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRisco(i)} disabled={riscos.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="md:col-span-12">
                  <Input value={r.responsavel} onChange={(e) => updateRisco(i, { responsavel: e.target.value })} placeholder="Responsável pela medida" className="h-8" />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">4. EPIs e observações</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="epis">EPIs obrigatórios (um por linha ou separados por vírgula)</Label>
            <textarea
              id="epis" value={episRaw} onChange={(e) => setEpisRaw(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="Capacete classe B&#10;Luva isolante 20 kV&#10;Botina dielétrica"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <textarea
              id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">5. Assinatura do responsável</CardTitle></CardHeader>
        <CardContent>
          <SignatureCanvas onChange={setAssinaturaResp} />
        </CardContent>
      </Card>

      {errors._form && (
        <p className="text-sm text-destructive" role="alert">{errors._form[0]}</p>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/documentos">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Emitir APR
        </Button>
      </div>
    </div>
  )
}

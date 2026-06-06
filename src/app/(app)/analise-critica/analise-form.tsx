"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ClipboardCheck } from "lucide-react"
import { type AnaliseCriticaInput } from "@/lib/validations/analise-critica"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"

type FormErrors = { _form?: string[] }
type AnaliseExistente = AnaliseCriticaInput & { id: string }

function Area({ id, label, value, onChange, placeholder, rows = 4 }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </div>
  )
}

export function AnaliseForm({
  analise, action,
}: {
  analise?: AnaliseExistente
  action: (payload: AnaliseCriticaInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [data, setData] = useState(analise?.data_reuniao?.slice(0, 10) ?? hojeBrasilia())
  const [periodo, setPeriodo] = useState(analise?.periodo ?? "")
  const [participantes, setParticipantes] = useState(analise?.participantes ?? "")
  const [entradas, setEntradas] = useState(analise?.entradas_consideradas ?? "")
  const [desempenho, setDesempenho] = useState(analise?.desempenho_resumo ?? "")
  const [conclusoes, setConclusoes] = useState(analise?.conclusoes ?? "")
  const [decisoes, setDecisoes] = useState(analise?.decisoes ?? "")
  const [status, setStatus] = useState<string>(analise?.status ?? "agendada")

  function handleSubmit() {
    const payload: AnaliseCriticaInput = {
      data_reuniao: data,
      periodo: periodo || null,
      participantes: participantes || null,
      entradas_consideradas: entradas || null,
      desempenho_resumo: desempenho || null,
      conclusoes: conclusoes || null,
      decisoes: decisoes || null,
      status: status as AnaliseCriticaInput["status"],
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{analise ? "Editar análise crítica" : "Nova análise crítica"}</h1>
          <p className="text-muted-foreground">ISO 45001 — 9.3. Análise crítica do SGSST pela direção.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Reunião</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="dr">Data *</Label>
            <Input id="dr" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="per">Período de referência</Label>
            <Input id="per" value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Ex: 2026 — 1º semestre" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="part">Participantes</Label>
            <Input id="part" value={participantes} onChange={(e) => setParticipantes(e.target.value)} placeholder="Direção, SESMT, representantes dos trabalhadores..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entradas</CardTitle>
          <CardDescription>Inclua: ações anteriores, mudanças de contexto/requisitos legais, desempenho (objetivos, indicadores TF/TG), NCs e ações corretivas, resultados de auditorias, consulta e participação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Area id="ent" label="Entradas consideradas" value={entradas} onChange={setEntradas} />
          <Area id="des" label="Resumo do desempenho de SST" value={desempenho} onChange={setDesempenho} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saídas</CardTitle>
          <CardDescription>Conclusões sobre adequação, suficiência e eficácia do SGSST + decisões (melhoria, mudanças, recursos, ações).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Area id="conc" label="Conclusões" value={conclusoes} onChange={setConclusoes} />
          <Area id="dec" label="Decisões e ações" value={decisoes} onChange={setDecisoes} />
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/analise-critica">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !data}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {analise ? "Salvar alterações" : "Registrar análise"}
        </Button>
      </div>
    </div>
  )
}

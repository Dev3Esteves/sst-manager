"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Target } from "lucide-react"
import { OBJETIVO_STATUS, type ObjetivoInput } from "@/lib/validations/objetivo"

type FormErrors = { _form?: string[] }
type ObjetivoExistente = ObjetivoInput & { id: string }

export function ObjetivoForm({
  objetivo, action,
}: {
  objetivo?: ObjetivoExistente
  action: (payload: ObjetivoInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState(objetivo?.titulo ?? "")
  const [descricao, setDescricao] = useState(objetivo?.descricao ?? "")
  const [indicador, setIndicador] = useState(objetivo?.indicador ?? "")
  const [meta, setMeta] = useState(objetivo?.meta ?? "")
  const [linhaBase, setLinhaBase] = useState(objetivo?.linha_base ?? "")
  const [valorAtual, setValorAtual] = useState(objetivo?.valor_atual ?? "")
  const [prazo, setPrazo] = useState(objetivo?.prazo?.slice(0, 10) ?? "")
  const [responsavel, setResponsavel] = useState(objetivo?.responsavel_nome ?? "")
  const [recursos, setRecursos] = useState(objetivo?.recursos ?? "")
  const [status, setStatus] = useState<string>(objetivo?.status ?? "planejado")

  function handleSubmit() {
    const payload: ObjetivoInput = {
      titulo,
      descricao: descricao || null,
      indicador: indicador || null,
      meta: meta || null,
      linha_base: linhaBase || null,
      valor_atual: valorAtual || null,
      prazo: prazo || null,
      responsavel_nome: responsavel || null,
      recursos: recursos || null,
      status: status as ObjetivoInput["status"],
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{objetivo ? "Editar objetivo" : "Novo objetivo de SST"}</h1>
          <p className="text-muted-foreground">ISO 45001 — 6.2. Objetivo mensurável, coerente com a Política de SST.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Objetivo</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tit">Título *</Label>
            <Input id="tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Reduzir a taxa de frequência de acidentes" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="desc">Descrição</Label>
            <textarea id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ind">Indicador (como medir)</Label>
            <Input id="ind" value={indicador} onChange={(e) => setIndicador(e.target.value)} placeholder="Ex: TF (NBR 14280)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta">Meta</Label>
            <Input id="meta" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Ex: TF < 5,0 no ano" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lb">Linha de base</Label>
            <Input id="lb" value={linhaBase} onChange={(e) => setLinhaBase(e.target.value)} placeholder="Ex: TF = 8,2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="va">Valor atual</Label>
            <Input id="va" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Planejamento</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="prz">Prazo</Label>
            <Input id="prz" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resp">Responsável</Label>
            <Input id="resp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(OBJETIVO_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="rec">Recursos necessários</Label>
            <Input id="rec" value={recursos} onChange={(e) => setRecursos(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/objetivos">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !titulo.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {objetivo ? "Salvar alterações" : "Criar objetivo"}
        </Button>
      </div>
    </div>
  )
}

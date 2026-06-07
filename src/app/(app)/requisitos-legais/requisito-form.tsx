"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Scale } from "lucide-react"
import { REQ_TIPOS, type RequisitoLegalInput } from "@/lib/validations/requisito-legal"

type FormErrors = { _form?: string[] }
type RequisitoExistente = {
  id: string; tipo: string; referencia: string; titulo: string | null; aplicabilidade: string | null
  atende: boolean | null; evidencia: string | null; responsavel_nome: string | null; data_avaliacao: string | null; ativo: boolean
}

export function RequisitoForm({
  requisito, action,
}: {
  requisito?: RequisitoExistente
  action: (payload: RequisitoLegalInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState<string>(requisito?.tipo ?? "nr")
  const [referencia, setReferencia] = useState(requisito?.referencia ?? "")
  const [titulo, setTitulo] = useState(requisito?.titulo ?? "")
  const [aplicabilidade, setAplicabilidade] = useState(requisito?.aplicabilidade ?? "")
  const [atende, setAtende] = useState<string>(requisito ? (requisito.atende === true ? "sim" : requisito.atende === false ? "nao" : "na") : "na")
  const [evidencia, setEvidencia] = useState(requisito?.evidencia ?? "")
  const [responsavel, setResponsavel] = useState(requisito?.responsavel_nome ?? "")
  const [dataAval, setDataAval] = useState(requisito?.data_avaliacao?.slice(0, 10) ?? "")
  const [ativo, setAtivo] = useState(requisito?.ativo ?? true)

  function handleSubmit() {
    const payload: RequisitoLegalInput = {
      tipo: tipo as RequisitoLegalInput["tipo"],
      referencia,
      titulo: titulo || null,
      aplicabilidade: aplicabilidade || null,
      atende: atende as RequisitoLegalInput["atende"],
      evidencia: evidencia || null,
      responsavel_nome: responsavel || null,
      data_avaliacao: dataAval || null,
      ativo,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Scale className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{requisito ? "Editar requisito legal" : "Novo requisito legal"}</h1>
          <p className="text-muted-foreground">ISO 45001 — 6.1.3 / avaliação de atendimento (9.1.2).</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Requisito</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(REQ_TIPOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref">Referência *</Label>
            <Input id="ref" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ex: NR-35, Lei 6.514/77" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tit">Título / ementa</Label>
            <Input id="tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Trabalho em Altura" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="apl">Aplicabilidade</Label>
            <textarea id="apl" value={aplicabilidade} onChange={(e) => setAplicabilidade(e.target.value)} rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Onde/como se aplica na organização" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Avaliação de atendimento</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Atende?</Label>
            <Select value={atende} onValueChange={setAtende}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim — atende</SelectItem>
                <SelectItem value="nao">Não atende</SelectItem>
                <SelectItem value="na">Não avaliado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resp">Responsável</Label>
            <Input id="resp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dav">Data da avaliação</Label>
            <Input id="dav" type="date" value={dataAval} onChange={(e) => setDataAval(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="evi">Evidência de atendimento</Label>
            <textarea id="evi" value={evidencia} onChange={(e) => setEvidencia(e.target.value)} rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Como o requisito é atendido (documentos, controles, registros)" />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-3 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4" />
            Requisito ativo (aplicável)
          </label>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/requisitos-legais">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !referencia.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {requisito ? "Salvar alterações" : "Cadastrar requisito"}
        </Button>
      </div>
    </div>
  )
}

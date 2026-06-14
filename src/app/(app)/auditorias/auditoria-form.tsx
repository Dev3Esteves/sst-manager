"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ClipboardCheck } from "lucide-react"
import { AUDITORIA_STATUS, type AuditoriaInput } from "@/lib/validations/auditoria"

type Obra = { id: string; nome: string }
type FormErrors = { _form?: string[] }
type AuditoriaExistente = AuditoriaInput & { id: string }
const SEM_OBRA = "__sem_obra__"

export function AuditoriaForm({
  auditoria, obras, action,
}: {
  auditoria?: AuditoriaExistente
  obras: Obra[]
  action: (payload: AuditoriaInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState(auditoria?.titulo ?? "")
  const [escopo, setEscopo] = useState(auditoria?.escopo ?? "")
  const [criterios, setCriterios] = useState(auditoria?.criterios ?? "ISO 45001:2018; NRs aplicáveis; procedimentos internos")
  const [auditor, setAuditor] = useState(auditoria?.auditor_nome ?? "")
  const [obraId, setObraId] = useState(auditoria?.obra_id ?? "")
  const [dataPlan, setDataPlan] = useState(auditoria?.data_planejada?.slice(0, 10) ?? "")
  const [dataReal, setDataReal] = useState(auditoria?.data_realizacao?.slice(0, 10) ?? "")
  const [conclusao, setConclusao] = useState(auditoria?.conclusao ?? "")
  const [status, setStatus] = useState<string>(auditoria?.status ?? "planejada")

  function handleSubmit() {
    const payload: AuditoriaInput = {
      titulo,
      escopo: escopo || null,
      criterios: criterios || null,
      auditor_nome: auditor || null,
      obra_id: obraId || null,
      data_planejada: dataPlan || null,
      data_realizacao: dataReal || null,
      conclusao: conclusao || null,
      status: status as AuditoriaInput["status"],
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
          <h1 className="text-3xl font-bold tracking-tight">{auditoria ? "Editar auditoria" : "Nova auditoria interna"}</h1>
          <p className="text-muted-foreground">ISO 45001 — 9.2. {auditoria ? "Registre as constatações abaixo." : "Após criar, registre as constatações."}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Planejamento</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tit">Título *</Label>
            <Input id="tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Auditoria interna SGSST — Obra X — 2026/1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aud">Auditor</Label>
            <Input id="aud" value={auditor} onChange={(e) => setAuditor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="obra">Obra (opcional)</Label>
            <Select value={obraId || SEM_OBRA} onValueChange={(v) => setObraId(v === SEM_OBRA ? "" : v)}>
              <SelectTrigger id="obra"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_OBRA}>— Nenhuma —</SelectItem>
                {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dp">Data planejada</Label>
            <Input id="dp" type="date" value={dataPlan} onChange={(e) => setDataPlan(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dr">Data de realização</Label>
            <Input id="dr" type="date" value={dataReal} onChange={(e) => setDataReal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(AUDITORIA_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="esc">Escopo</Label>
            <textarea id="esc" value={escopo} onChange={(e) => setEscopo(e.target.value)} rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Processos/áreas/cláusulas auditadas" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cri">Critérios</Label>
            <Input id="cri" value={criterios} onChange={(e) => setCriterios(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="conc">Conclusão</Label>
            <textarea id="conc" value={conclusao} onChange={(e) => setConclusao(e.target.value)} rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Resumo dos resultados e encaminhamentos" />
          </div>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/auditorias">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !titulo.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {auditoria ? "Salvar alterações" : "Criar auditoria"}
        </Button>
      </div>
    </div>
  )
}

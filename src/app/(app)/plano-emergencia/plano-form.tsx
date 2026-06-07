"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Siren } from "lucide-react"
import { CENARIOS_EMERGENCIA, type PlanoEmergenciaInput } from "@/lib/validations/plano-emergencia"

type Obra = { id: string; nome: string }
type FormErrors = { _form?: string[] }
type PlanoExistente = PlanoEmergenciaInput & { id: string }
const SEM_OBRA = "__sem_obra__"

function Area({ id, label, value, onChange, rows = 3, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </div>
  )
}

export function PlanoForm({
  plano, obras, action,
}: {
  plano?: PlanoExistente
  obras: Obra[]
  action: (payload: PlanoEmergenciaInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState(plano?.titulo ?? "")
  const [cenario, setCenario] = useState<string>(plano?.cenario ?? "incendio")
  const [obraId, setObraId] = useState(plano?.obra_id ?? "")
  const [descricao, setDescricao] = useState(plano?.descricao ?? "")
  const [procedimento, setProcedimento] = useState(plano?.procedimento_resposta ?? "")
  const [recursos, setRecursos] = useState(plano?.recursos ?? "")
  const [brigada, setBrigada] = useState(plano?.brigada_responsavel ?? "")
  const [contatos, setContatos] = useState(plano?.contatos_emergencia ?? "")
  const [ultimoSim, setUltimoSim] = useState(plano?.ultimo_simulado?.slice(0, 10) ?? "")
  const [proximoSim, setProximoSim] = useState(plano?.proximo_simulado?.slice(0, 10) ?? "")
  const [licoes, setLicoes] = useState(plano?.licoes_aprendidas ?? "")
  const [dataRev, setDataRev] = useState(plano?.data_revisao?.slice(0, 10) ?? "")
  const [status, setStatus] = useState<string>(plano?.status ?? "ativo")

  function handleSubmit() {
    const payload: PlanoEmergenciaInput = {
      titulo,
      cenario: cenario as PlanoEmergenciaInput["cenario"],
      obra_id: obraId || null,
      descricao: descricao || null,
      procedimento_resposta: procedimento || null,
      recursos: recursos || null,
      brigada_responsavel: brigada || null,
      contatos_emergencia: contatos || null,
      ultimo_simulado: ultimoSim || null,
      proximo_simulado: proximoSim || null,
      licoes_aprendidas: licoes || null,
      data_revisao: dataRev || null,
      status: status as PlanoEmergenciaInput["status"],
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Siren className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{plano ? "Editar plano de emergência" : "Novo plano de emergência"}</h1>
          <p className="text-muted-foreground">ISO 45001 — 8.2. Preparação e resposta a emergências.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Cenário</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tit">Título *</Label>
            <Input id="tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de cenário *</Label>
            <Select value={cenario} onValueChange={setCenario}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CENARIOS_EMERGENCIA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Obra (opcional)</Label>
            <Select value={obraId || SEM_OBRA} onValueChange={(v) => setObraId(v === SEM_OBRA ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_OBRA}>— Nenhuma —</SelectItem>
                {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="em_revisao">Em revisão</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Area id="desc" label="Descrição do cenário" value={descricao} onChange={setDescricao} rows={2} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Resposta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Area id="proc" label="Procedimento de resposta" value={procedimento} onChange={setProcedimento} rows={4} placeholder="Passos a seguir, acionamento, evacuação, ponto de encontro..." />
          <Area id="rec" label="Recursos (brigada, extintores, kit, rotas)" value={recursos} onChange={setRecursos} rows={2} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="brig">Brigada / responsável</Label><Input id="brig" value={brigada} onChange={(e) => setBrigada(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="cont">Contatos de emergência</Label><Input id="cont" value={contatos} onChange={(e) => setContatos(e.target.value)} placeholder="SAMU 192, Bombeiros 193, brigada interna..." /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Simulados e revisão</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="us">Último simulado</Label><Input id="us" type="date" value={ultimoSim} onChange={(e) => setUltimoSim(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="ps">Próximo simulado</Label><Input id="ps" type="date" value={proximoSim} onChange={(e) => setProximoSim(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="dr">Data da revisão</Label><Input id="dr" type="date" value={dataRev} onChange={(e) => setDataRev(e.target.value)} /></div>
          <div className="md:col-span-3"><Area id="lic" label="Lições aprendidas (simulados/emergências reais)" value={licoes} onChange={setLicoes} rows={2} /></div>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/plano-emergencia">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !titulo.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {plano ? "Salvar alterações" : "Criar plano"}
        </Button>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Replace } from "lucide-react"
import { MUDANCA_TIPOS, MUDANCA_STATUS, type GestaoMudancaInput } from "@/lib/validations/gestao-mudanca"

type Obra = { id: string; nome: string }
type FormErrors = { _form?: string[] }
const SEM_OBRA = "__sem_obra__"

type MudancaExistente = GestaoMudancaInput & { id: string }

function Area({ id, label, value, onChange, placeholder, rows = 3 }: {
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

export function MudancaForm({
  mudanca, obras, action,
}: {
  mudanca?: MudancaExistente
  obras: Obra[]
  action: (payload: GestaoMudancaInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState(mudanca?.titulo ?? "")
  const [descricao, setDescricao] = useState(mudanca?.descricao ?? "")
  const [tipo, setTipo] = useState<string>(mudanca?.tipo ?? "produto_processo")
  const [carater, setCarater] = useState<string>(mudanca?.carater ?? "permanente")
  const [motivo, setMotivo] = useState(mudanca?.motivo ?? "")
  const [dataPrevista, setDataPrevista] = useState(mudanca?.data_prevista?.slice(0, 10) ?? "")
  const [obraId, setObraId] = useState(mudanca?.obra_id ?? "")
  const [responsavel, setResponsavel] = useState(mudanca?.responsavel_nome ?? "")
  const [status, setStatus] = useState<string>(mudanca?.status ?? "proposta")
  const [perigos, setPerigos] = useState(mudanca?.perigos_riscos ?? "")
  const [controles, setControles] = useState(mudanca?.medidas_controle ?? "")
  const [comunicacao, setComunicacao] = useState(mudanca?.comunicacao ?? "")
  const [dataImpl, setDataImpl] = useState(mudanca?.data_implementacao?.slice(0, 10) ?? "")
  const [avaliacao, setAvaliacao] = useState(mudanca?.avaliacao_pos ?? "")
  const [envolveAq, setEnvolveAq] = useState(mudanca?.envolve_aquisicao ?? false)
  const [criteriosAq, setCriteriosAq] = useState(mudanca?.criterios_aquisicao ?? "")
  const [adkarC, setAdkarC] = useState(mudanca?.adkar_consciencia ?? "")
  const [adkarD, setAdkarD] = useState(mudanca?.adkar_desejo ?? "")
  const [adkarK, setAdkarK] = useState(mudanca?.adkar_conhecimento ?? "")
  const [adkarA, setAdkarA] = useState(mudanca?.adkar_habilidade ?? "")
  const [adkarR, setAdkarR] = useState(mudanca?.adkar_reforco ?? "")

  function handleSubmit() {
    const payload: GestaoMudancaInput = {
      titulo, descricao,
      tipo: tipo as GestaoMudancaInput["tipo"],
      carater: carater as GestaoMudancaInput["carater"],
      motivo: motivo || null,
      data_prevista: dataPrevista || null,
      obra_id: obraId || null,
      perigos_riscos: perigos || null,
      medidas_controle: controles || null,
      comunicacao: comunicacao || null,
      data_implementacao: dataImpl || null,
      avaliacao_pos: avaliacao || null,
      responsavel_nome: responsavel || null,
      envolve_aquisicao: envolveAq,
      criterios_aquisicao: envolveAq ? (criteriosAq || null) : null,
      adkar_consciencia: adkarC || null,
      adkar_desejo: adkarD || null,
      adkar_conhecimento: adkarK || null,
      adkar_habilidade: adkarA || null,
      adkar_reforco: adkarR || null,
      status: status as GestaoMudancaInput["status"],
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Replace className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{mudanca ? "Editar mudança" : "Nova gestão de mudança"}</h1>
          <p className="text-muted-foreground">ISO 45001 — 8.1.3/8.1.4. Avalie os riscos de SST antes de implementar.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">1. Identificação da mudança</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tit">Título *</Label>
            <Input id="tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(MUDANCA_TIPOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Caráter</Label>
            <Select value={carater} onValueChange={setCarater}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="permanente">Permanente</SelectItem>
                <SelectItem value="temporaria">Temporária</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Area id="desc" label="Descrição da mudança *" value={descricao} onChange={setDescricao} rows={3} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Area id="mot" label="Motivo / justificativa" value={motivo} onChange={setMotivo} rows={2} />
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
            <Label htmlFor="dp">Data prevista</Label>
            <Input id="dp" type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resp">Responsável</Label>
            <Input id="resp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(MUDANCA_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Avaliação e controle (antes de implementar)</CardTitle>
          <CardDescription>Identifique os perigos/riscos e avalie os controles antes da mudança.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Area id="per" label="Perigos, riscos e oportunidades identificados" value={perigos} onChange={setPerigos} />
          <Area id="ctrl" label="Medidas de controle (existentes e requeridas)" value={controles} onChange={setControles} />
          <Area id="com" label="Comunicação às partes relevantes" value={comunicacao} onChange={setComunicacao} rows={2} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">3. Implementação e monitoramento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="di">Data de implementação</Label>
            <Input id="di" type="date" value={dataImpl} onChange={(e) => setDataImpl(e.target.value)} />
          </div>
          <Area id="ava" label="Monitoramento / revisão (inclui consequências não intencionais)" value={avaliacao} onChange={setAvaliacao} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={envolveAq} onChange={(e) => setEnvolveAq(e.target.checked)} className="h-4 w-4" />
            Envolve aquisição / contratação (8.1.4)
          </label>
          {envolveAq && <Area id="aq" label="Critérios de SST na aquisição/contratação" value={criteriosAq} onChange={setCriteriosAq} rows={2} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Gestão da mudança nas pessoas (ADKAR)</CardTitle>
          <CardDescription>Endereça o engajamento e a resistência (ISO 8.1.3). Preencha conforme aplicável.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Area id="adk-c" label="Consciência (Awareness) — por que a mudança é necessária" value={adkarC} onChange={setAdkarC} rows={2} />
          <Area id="adk-d" label="Desejo (Desire) — patrocínio e engajamento das pessoas" value={adkarD} onChange={setAdkarD} rows={2} />
          <Area id="adk-k" label="Conhecimento (Knowledge) — treinamento/capacitação necessários" value={adkarK} onChange={setAdkarK} rows={2} />
          <Area id="adk-a" label="Habilidade (Ability) — capacidade de executar no desempenho exigido" value={adkarA} onChange={setAdkarA} rows={2} />
          <Area id="adk-r" label="Reforço (Reinforcement) — como sustentar e consolidar a mudança" value={adkarR} onChange={setAdkarR} rows={2} />
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/gestao-mudanca">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !titulo.trim() || descricao.trim().length < 5}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mudanca ? "Salvar alterações" : "Registrar mudança"}
        </Button>
      </div>
    </div>
  )
}

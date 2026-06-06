"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Globe, Users, Save, Target } from "lucide-react"
import { createQuestao, toggleQuestao, createParte, toggleParte, salvarEscopo } from "./actions"

type Questao = { id: string; tipo: string; descricao: string; ativo: boolean }
type Parte = { id: string; nome: string; tipo: string; necessidades: string | null; requisitos: string | null; ativo: boolean }
type Escopo = { conteudo: string; exclusoes: string | null; aprovado_por_nome: string | null; data_aprovacao: string | null } | null

export function ContextoManager({ questoes, partes, escopo }: { questoes: Questao[]; partes: Parte[]; escopo: Escopo }) {
  return (
    <div className="space-y-6">
      <QuestoesCard questoes={questoes} />
      <PartesCard partes={partes} />
      <EscopoCard escopo={escopo} />
    </div>
  )
}

function EscopoCard({ escopo }: { escopo: Escopo }) {
  const [pending, startTransition] = useTransition()
  const [conteudo, setConteudo] = useState(escopo?.conteudo ?? "")
  const [exclusoes, setExclusoes] = useState(escopo?.exclusoes ?? "")
  const [aprovado, setAprovado] = useState(escopo?.aprovado_por_nome ?? "")
  const [data, setData] = useState(escopo?.data_aprovacao?.slice(0, 10) ?? "")
  const [erro, setErro] = useState<string | null>(null)
  function salvar() {
    setErro(null)
    startTransition(async () => {
      const r = await salvarEscopo({ conteudo, exclusoes: exclusoes || null, aprovado_por_nome: aprovado || null, data_aprovacao: data || null })
      if ("error" in r && r.error) setErro(r.error._form[0]); else toast.success("Escopo do SGSST salvo.")
    })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Escopo do SGSST (4.3/4.4)</CardTitle>
        <CardDescription>Limites e aplicabilidade do sistema de gestão de SST, com exclusões justificadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Escopo</Label>
          <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={5}
            placeholder="Ex: O SGSST abrange todas as obras e atividades da [EMPRESA] no território nacional, incluindo trabalhadores próprios e terceiros sob seu controle..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Exclusões (justificadas)</Label>
          <Input value={exclusoes} onChange={(e) => setExclusoes(e.target.value)} placeholder="Opcional" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Aprovado por</Label>
            <Input value={aprovado} onChange={(e) => setAprovado(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data de aprovação</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
        <Button type="button" size="sm" onClick={salvar} disabled={pending || conteudo.trim().length < 20}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar escopo
        </Button>
      </CardContent>
    </Card>
  )
}

function StatusToggle({ ativo, onToggle }: { ativo: boolean; onToggle: () => Promise<{ error?: { _form: string[] } } | { ok: true }> }) {
  const [pending, startTransition] = useTransition()
  return (
    <button type="button" disabled={pending} className="disabled:opacity-50 shrink-0"
      onClick={() => startTransition(async () => { const r = await onToggle(); if ("error" in r && r.error) toast.error(r.error._form[0]) })}>
      <Badge variant={ativo ? "regular" : "secondary"}>{ativo ? "Ativo" : "Inativo"}</Badge>
    </button>
  )
}

function QuestoesCard({ questoes }: { questoes: Questao[] }) {
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState("interna")
  const [descricao, setDescricao] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  function add() {
    setErro(null)
    startTransition(async () => {
      const r = await createQuestao({ tipo: tipo as "interna" | "externa", descricao })
      if ("error" in r) setErro(r.error?._form?.[0] ?? "Erro"); else setDescricao("")
    })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Questões de contexto (4.1)</CardTitle>
        <CardDescription>Questões internas e externas relevantes ao propósito e que afetam o SGSST.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
          <div className="space-y-1.5 w-36">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interna">Interna</SelectItem>
                <SelectItem value="externa">Externa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs">Questão</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: rotatividade de mão de obra; exigências de clientes; clima organizacional" />
          </div>
          <Button type="button" size="sm" onClick={add} disabled={pending || !descricao.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </Button>
        </div>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
        <div className="divide-y rounded-md border">
          {questoes.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <Badge variant="outline" className="mr-2 capitalize">{q.tipo}</Badge>
                <span className="text-sm">{q.descricao}</span>
              </div>
              <StatusToggle ativo={q.ativo} onToggle={() => toggleQuestao(q.id, !q.ativo)} />
            </div>
          ))}
          {questoes.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma questão cadastrada.</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function PartesCard({ partes }: { partes: Parte[] }) {
  const [pending, startTransition] = useTransition()
  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState("externa")
  const [necessidades, setNecessidades] = useState("")
  const [requisitos, setRequisitos] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  function add() {
    setErro(null)
    startTransition(async () => {
      const r = await createParte({ nome, tipo: tipo as "interna" | "externa", necessidades: necessidades || null, requisitos: requisitos || null })
      if ("error" in r) setErro(r.error?._form?.[0] ?? "Erro"); else { setNome(""); setNecessidades(""); setRequisitos("") }
    })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Partes interessadas (4.2)</CardTitle>
        <CardDescription>Quem é relevante para o SGSST, suas necessidades/expectativas e requisitos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Parte interessada</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Trabalhadores, Clientes, Órgãos fiscalizadores, CIPA" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="interna">Interna</SelectItem>
                  <SelectItem value="externa">Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input value={necessidades} onChange={(e) => setNecessidades(e.target.value)} placeholder="Necessidades / expectativas" />
          <Input value={requisitos} onChange={(e) => setRequisitos(e.target.value)} placeholder="Requisitos (legais/outros) aplicáveis" />
          {erro && <p className="text-xs text-destructive">{erro}</p>}
          <Button type="button" size="sm" onClick={add} disabled={pending || !nome.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar parte
          </Button>
        </div>
        <div className="divide-y rounded-md border">
          {partes.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <div><Badge variant="outline" className="mr-2 capitalize">{p.tipo}</Badge><span className="text-sm font-medium">{p.nome}</span></div>
                {p.necessidades && <div className="text-xs text-muted-foreground mt-0.5">Necessidades: {p.necessidades}</div>}
                {p.requisitos && <div className="text-xs text-muted-foreground">Requisitos: {p.requisitos}</div>}
              </div>
              <StatusToggle ativo={p.ativo} onToggle={() => toggleParte(p.id, !p.ativo)} />
            </div>
          ))}
          {partes.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma parte interessada cadastrada.</div>}
        </div>
      </CardContent>
    </Card>
  )
}

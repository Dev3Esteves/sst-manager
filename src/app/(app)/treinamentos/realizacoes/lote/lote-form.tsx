"use client"

import Link from "next/link"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
import { useState, useTransition, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Search, Users, ListChecks } from "lucide-react"
import type { TreinamentoLoteInput } from "@/lib/validations/treinamento-cargo"

type Colaborador = { id: string; nome_completo: string; cargo_titulo: string | null }
type Treinamento = { id: string; titulo: string; nr_referencia: string | null; validade_meses: number | null }
type Opcao = { id: string; nome: string }
type FormErrors = { _form?: string[] }

const NENHUM = "__none__"

export function LoteForm({
  treinamentos, colaboradores, instrutores, entidades, action,
}: {
  treinamentos: Treinamento[]
  colaboradores: Colaborador[]
  instrutores: Opcao[]
  entidades: Opcao[]
  action: (payload: TreinamentoLoteInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [treinamentoId, setTreinamentoId] = useState("")
  const [data, setData] = useState(hojeBrasilia())
  const [instrutorId, setInstrutorId] = useState(NENHUM)
  const [entidadeId, setEntidadeId] = useState(NENHUM)
  const [local, setLocal] = useState("")
  const [busca, setBusca] = useState("")
  const [sel, setSel] = useState<Set<string>>(new Set())

  const filtrados = useMemo(
    () => colaboradores.filter((c) => !busca || c.nome_completo.toLowerCase().includes(busca.toLowerCase())),
    [colaboradores, busca],
  )

  function toggle(id: string) {
    setSel((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function selecionarTodosFiltrados() {
    setSel((prev) => { const n = new Set(prev); filtrados.forEach((c) => n.add(c.id)); return n })
  }
  function limpar() { setSel(new Set()) }

  function handleSubmit() {
    const instrutor = instrutorId !== NENHUM ? instrutores.find((i) => i.id === instrutorId)?.nome ?? null : null
    const entidade = entidadeId !== NENHUM ? entidades.find((e) => e.id === entidadeId)?.nome ?? null : null
    const payload: TreinamentoLoteInput = {
      treinamento_id: treinamentoId,
      data_realizacao: data,
      instrutor,
      entidade,
      instrutor_id: instrutorId !== NENHUM ? instrutorId : null,
      entidade_id: entidadeId !== NENHUM ? entidadeId : null,
      local: local || null,
      colaborador_ids: Array.from(sel),
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aplicar treinamento em lote</h1>
        <p className="text-muted-foreground">Registra a mesma realização para vários colaboradores de uma vez.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados da realização</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="treinamento_id">Treinamento *</Label>
            <Select value={treinamentoId} onValueChange={setTreinamentoId}>
              <SelectTrigger id="treinamento_id"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {treinamentos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.titulo}{t.nr_referencia ? ` — ${t.nr_referencia}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data de realização *</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instrutor_id">Instrutor</Label>
            <Select value={instrutorId} onValueChange={setInstrutorId}>
              <SelectTrigger id="instrutor_id"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>—</SelectItem>
                {instrutores.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="entidade_id">Entidade</Label>
            <Select value={entidadeId} onValueChange={setEntidadeId}>
              <SelectTrigger id="entidade_id"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>—</SelectItem>
                {entidades.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Colaboradores</CardTitle>
            <CardDescription>{sel.size} selecionado(s) de {colaboradores.length}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selecionarTodosFiltrados}>
              <ListChecks className="h-4 w-4" /> Selecionar {busca ? "filtrados" : "todos"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={limpar} disabled={sel.size === 0}>Limpar</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." className="pl-8" />
          </div>
          <div className="divide-y rounded-md border max-h-96 overflow-y-auto">
            {filtrados.map((c) => (
              <label key={c.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-accent/50">
                <input type="checkbox" checked={sel.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4" />
                <span className="text-sm">{c.nome_completo}{c.cargo_titulo ? <span className="text-muted-foreground"> · {c.cargo_titulo}</span> : null}</span>
              </label>
            ))}
            {filtrados.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum colaborador.</div>}
          </div>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/treinamentos/realizacoes">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !treinamentoId || sel.size === 0}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Aplicar a {sel.size} colaborador(es)
        </Button>
      </div>
    </div>
  )
}

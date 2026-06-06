"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, MessageSquareText, Users } from "lucide-react"
import { createDdsTema, toggleDdsTema, createDdsMediador, toggleDdsMediador } from "./actions"

type Tema = { id: string; titulo: string; descricao: string | null; ativo: boolean }
type Mediador = { id: string; nome: string; cargo: string | null; tipo: string; ativo: boolean }

export function CatalogoManager({ temas, mediadores }: { temas: Tema[]; mediadores: Mediador[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TemasCard temas={temas} />
      <MediadoresCard mediadores={mediadores} />
    </div>
  )
}

function TemasCard({ temas }: { temas: Tema[] }) {
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [erro, setErro] = useState<string | null>(null)

  function add() {
    setErro(null)
    startTransition(async () => {
      const r = await createDdsTema({ titulo, descricao: descricao || null, ativo: true })
      if ("error" in r) setErro(r.error?._form?.[0] ?? "Erro")
      else { setTitulo(""); setDescricao("") }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><MessageSquareText className="h-4 w-4" /> Temas de DDS</CardTitle>
        <CardDescription>Catálogo sugerido ao criar um DDS.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border p-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Novo tema</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: NR-35 — pontos de ancoragem" />
          </div>
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" />
          {erro && <p className="text-xs text-destructive">{erro}</p>}
          <Button type="button" size="sm" onClick={add} disabled={pending || !titulo.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar tema
          </Button>
        </div>
        <div className="divide-y rounded-md border">
          {temas.map((t) => <ItemRow key={t.id} id={t.id} titulo={t.titulo} sub={t.descricao} ativo={t.ativo} onToggle={toggleDdsTema} />)}
          {temas.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum tema cadastrado.</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function MediadoresCard({ mediadores }: { mediadores: Mediador[] }) {
  const [pending, startTransition] = useTransition()
  const [nome, setNome] = useState("")
  const [cargo, setCargo] = useState("")
  const [tipo, setTipo] = useState("interno")
  const [erro, setErro] = useState<string | null>(null)

  function add() {
    setErro(null)
    startTransition(async () => {
      const r = await createDdsMediador({ nome, cargo: cargo || null, tipo: tipo as "interno" | "externo", colaborador_id: null, ativo: true })
      if ("error" in r) setErro(r.error?._form?.[0] ?? "Erro")
      else { setNome(""); setCargo("") }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Mediadores de DDS</CardTitle>
        <CardDescription>Quem costuma conduzir os DDS (interno ou externo).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cargo</Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interno">Interno</SelectItem>
                <SelectItem value="externo">Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {erro && <p className="text-xs text-destructive">{erro}</p>}
          <Button type="button" size="sm" onClick={add} disabled={pending || !nome.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar mediador
          </Button>
        </div>
        <div className="divide-y rounded-md border">
          {mediadores.map((m) => (
            <ItemRow key={m.id} id={m.id} titulo={m.nome} sub={m.cargo ? `${m.cargo} · ${m.tipo}` : m.tipo} ativo={m.ativo} onToggle={toggleDdsMediador} />
          ))}
          {mediadores.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum mediador cadastrado.</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function ItemRow({
  id, titulo, sub, ativo, onToggle,
}: {
  id: string; titulo: string; sub: string | null; ativo: boolean
  onToggle: (id: string, ativo: boolean) => Promise<{ error?: { _form: string[] } } | { ok: true }>
}) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center justify-between gap-2 p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{titulo}</div>
        {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
      </div>
      <button
        type="button" disabled={pending}
        onClick={() => startTransition(() => { onToggle(id, !ativo) })}
        className="disabled:opacity-50 shrink-0"
        title={ativo ? "Inativar" : "Ativar"}
      >
        <Badge variant={ativo ? "regular" : "secondary"}>{ativo ? "Ativo" : "Inativo"}</Badge>
      </button>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, MapPin } from "lucide-react"
import { createObraLocal, toggleObraLocal } from "../actions"

type Local = { id: string; nome: string; tipo: string; ativo: boolean }
const TIPO_LABEL: Record<string, string> = { interna: "Interna", externa: "Externa", outro: "Outro" }

export function ObraLocaisManager({ obraId, locais }: { obraId: string; locais: Local[] }) {
  const [pending, startTransition] = useTransition()
  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState("interna")
  const [erro, setErro] = useState<string | null>(null)

  function add() {
    setErro(null)
    startTransition(async () => {
      const r = await createObraLocal({ obra_id: obraId, nome, tipo: tipo as "interna" | "externa" | "outro", ativo: true })
      if (r && "error" in r) setErro(r.error?._form?.[0] ?? "Erro")
      else setNome("")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Locais da obra</CardTitle>
        <CardDescription>Áreas usadas em inspeções, ocorrências e documentos. Padrão: Área Interna/Externa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <Label className="text-xs">Novo local</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Subestação, Galpão 2" />
          </div>
          <div className="space-y-1.5 w-32">
            <Label htmlFor="obra-local-tipo" className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="obra-local-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interna">Interna</SelectItem>
                <SelectItem value="externa">Externa</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={add} disabled={pending || !nome.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </Button>
        </div>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
        <div className="divide-y rounded-md border">
          {locais.map((l) => <LocalRow key={l.id} local={l} obraId={obraId} />)}
          {locais.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum local cadastrado.</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function LocalRow({ local, obraId }: { local: Local; obraId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center justify-between gap-2 p-3">
      <div>
        <span className="text-sm font-medium">{local.nome}</span>
        <span className="ml-2 text-xs text-muted-foreground">{TIPO_LABEL[local.tipo] ?? local.tipo}</span>
      </div>
      <button
        type="button" disabled={pending}
        onClick={() => startTransition(() => { toggleObraLocal(local.id, obraId, !local.ativo) })}
        className="disabled:opacity-50" title={local.ativo ? "Inativar" : "Ativar"}
      >
        <Badge variant={local.ativo ? "regular" : "secondary"}>{local.ativo ? "Ativo" : "Inativo"}</Badge>
      </button>
    </div>
  )
}

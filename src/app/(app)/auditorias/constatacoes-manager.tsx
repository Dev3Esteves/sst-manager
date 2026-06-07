"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { CONSTATACAO_TIPOS } from "@/lib/validations/auditoria"
import { addConstatacao, removeConstatacao } from "./actions"

type Constatacao = { id: string; tipo: string; clausula: string | null; descricao: string }

function tipoVariant(t: string): BadgeProps["variant"] {
  if (t === "nao_conformidade") return "vencido"
  if (t === "observacao") return "alerta"
  if (t === "oportunidade") return "outline"
  return "regular"
}

export function ConstatacoesManager({ auditoriaId, constatacoes }: { auditoriaId: string; constatacoes: Constatacao[] }) {
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState("nao_conformidade")
  const [clausula, setClausula] = useState("")
  const [descricao, setDescricao] = useState("")
  const [erro, setErro] = useState<string | null>(null)

  function add() {
    setErro(null)
    startTransition(async () => {
      const r = await addConstatacao({ auditoria_id: auditoriaId, tipo: tipo as "conformidade" | "nao_conformidade" | "observacao" | "oportunidade", clausula: clausula || null, descricao })
      if ("error" in r && r.error) setErro(r.error._form[0]); else { setClausula(""); setDescricao("") }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Constatações</CardTitle>
        <CardDescription>Conformidades, não-conformidades, observações e oportunidades identificadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CONSTATACAO_TIPOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cláusula/NR</Label>
              <Input value={clausula} onChange={(e) => setClausula(e.target.value)} placeholder="Ex: 8.1.2 / NR-35" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que foi constatado" />
            </div>
          </div>
          {erro && <p className="text-xs text-destructive">{erro}</p>}
          <Button type="button" size="sm" onClick={add} disabled={pending || descricao.trim().length < 3}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar constatação
          </Button>
        </div>
        <div className="divide-y rounded-md border">
          {constatacoes.map((c) => <ConstatacaoRow key={c.id} c={c} auditoriaId={auditoriaId} />)}
          {constatacoes.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma constatação registrada.</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function ConstatacaoRow({ c, auditoriaId }: { c: Constatacao; auditoriaId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-start justify-between gap-2 p-3">
      <div className="min-w-0">
        <Badge variant={tipoVariant(c.tipo)} className="mr-2">{CONSTATACAO_TIPOS[c.tipo] ?? c.tipo}</Badge>
        {c.clausula && <span className="text-xs text-muted-foreground mr-2">[{c.clausula}]</span>}
        <span className="text-sm">{c.descricao}</span>
      </div>
      <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" disabled={pending}
        onClick={() => startTransition(async () => { const r = await removeConstatacao(c.id, auditoriaId); if ("error" in r && r.error) toast.error(r.error._form[0]) })}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

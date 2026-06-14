"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
import { COMUNICACAO_TIPOS } from "@/lib/validations/comunicacao"
import { createComunicacao, toggleComunicacao } from "./actions"

type Registro = { id: string; data: string; tipo: string; assunto: string; publico_alvo: string | null; canal: string | null; ativo: boolean }

export function ComunicacaoManager({ registros }: { registros: Registro[] }) {
  const [pending, startTransition] = useTransition()
  const [data, setData] = useState(hojeBrasilia())
  const [tipo, setTipo] = useState("comunicacao_interna")
  const [assunto, setAssunto] = useState("")
  const [descricao, setDescricao] = useState("")
  const [publico, setPublico] = useState("")
  const [canal, setCanal] = useState("")
  const [responsavel, setResponsavel] = useState("")
  const [erro, setErro] = useState<string | null>(null)

  function add() {
    setErro(null)
    startTransition(async () => {
      const r = await createComunicacao({
        data, tipo: tipo as "consulta_participacao" | "comunicacao_interna" | "comunicacao_externa",
        assunto, descricao: descricao || null, publico_alvo: publico || null, canal: canal || null, responsavel_nome: responsavel || null,
      })
      if ("error" in r && r.error) setErro(r.error._form[0])
      else { setAssunto(""); setDescricao(""); setPublico(""); setCanal(""); setResponsavel(""); toast.success("Registro adicionado.") }
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Registros</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="comunicacao-tipo" className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="comunicacao-tipo"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(COMUNICACAO_TIPOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Assunto</Label>
              <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
            </div>
          </div>
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição / deliberações" />
          <div className="grid gap-2 sm:grid-cols-3">
            <Input value={publico} onChange={(e) => setPublico(e.target.value)} placeholder="Público-alvo" />
            <Input value={canal} onChange={(e) => setCanal(e.target.value)} placeholder="Canal (reunião, e-mail, mural, DDS...)" />
            <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Responsável" />
          </div>
          {erro && <p className="text-xs text-destructive">{erro}</p>}
          <Button type="button" size="sm" onClick={add} disabled={pending || assunto.trim().length < 3}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar registro
          </Button>
        </div>
        <div className="divide-y rounded-md border">
          {registros.map((reg) => <Row key={reg.id} reg={reg} />)}
          {registros.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum registro.</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function Row({ reg }: { reg: Registro }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-start justify-between gap-2 p-3">
      <div className="min-w-0">
        <Badge variant="outline" className="mr-2">{COMUNICACAO_TIPOS[reg.tipo] ?? reg.tipo}</Badge>
        <span className="text-sm font-medium">{reg.assunto}</span>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatDate(reg.data)}{reg.publico_alvo ? ` · ${reg.publico_alvo}` : ""}{reg.canal ? ` · ${reg.canal}` : ""}
        </div>
      </div>
      <button type="button" disabled={pending} className="disabled:opacity-50 shrink-0"
        onClick={() => startTransition(async () => { const r = await toggleComunicacao(reg.id, !reg.ativo); if ("error" in r && r.error) toast.error(r.error._form[0]) })}>
        <Badge variant={reg.ativo ? "regular" : "secondary"}>{reg.ativo ? "Ativo" : "Arquivado"}</Badge>
      </button>
    </div>
  )
}

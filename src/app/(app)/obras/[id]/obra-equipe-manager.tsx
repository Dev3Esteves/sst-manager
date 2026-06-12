"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Plus, Users, Trash2 } from "lucide-react"
import { createObraEquipe, removeObraEquipe } from "../actions"

type EquipeItem = { id: string; cargo_titulo: string; quantidade: number }

export function ObraEquipeManager({ obraId, equipe }: { obraId: string; equipe: EquipeItem[] }) {
  const [pending, startTransition] = useTransition()
  const [cargo, setCargo] = useState("")
  const [qtd, setQtd] = useState("1")
  const [erro, setErro] = useState<string | null>(null)

  const total = equipe.reduce((s, e) => s + (e.quantidade ?? 0), 0)

  function add() {
    setErro(null)
    startTransition(async () => {
      const r = await createObraEquipe({
        obra_id: obraId,
        cargo_titulo: cargo,
        quantidade: Number(qtd) || 0,
      })
      if (r && "error" in r) setErro(r.error?._form?.[0] ?? "Erro")
      else { setCargo(""); setQtd("1") }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Equipe da obra (funções)</CardTitle>
        <CardDescription>
          Aloque a equipe por função e quantidade. No PGR, é possível importar estas funções
          e o nº de expostos para os GHEs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <Label className="text-xs">Função / cargo</Label>
            <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Pedreiro, Eletricista, Servente" />
          </div>
          <div className="space-y-1.5 w-24">
            <Label className="text-xs">Quantidade</Label>
            <Input type="number" min={0} value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </div>
          <Button type="button" size="sm" onClick={add} disabled={pending || cargo.trim().length < 2}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </Button>
        </div>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
        <div className="divide-y rounded-md border">
          {equipe.map((e) => <EquipeRow key={e.id} item={e} obraId={obraId} />)}
          {equipe.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma função alocada.</div>}
          {equipe.length > 0 && (
            <div className="flex items-center justify-between p-3 text-sm font-medium bg-muted/30">
              <span>Total de expostos</span>
              <span>{total}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EquipeRow({ item, obraId }: { item: EquipeItem; obraId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center justify-between gap-2 p-3">
      <div>
        <span className="text-sm font-medium">{item.cargo_titulo}</span>
        <span className="ml-2 text-xs text-muted-foreground">{item.quantidade} pessoa(s)</span>
      </div>
      <Button
        type="button" variant="ghost" size="icon" disabled={pending}
        onClick={() => startTransition(() => { removeObraEquipe(item.id, obraId) })}
        title="Remover função da equipe"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

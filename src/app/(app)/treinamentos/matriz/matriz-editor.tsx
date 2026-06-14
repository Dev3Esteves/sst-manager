"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Save, GraduationCap } from "lucide-react"
import { salvarMatrizTreinamentoCargo } from "./actions"

type Cargo = { id: string; titulo: string }
type Treinamento = { id: string; titulo: string; nr_referencia: string | null }
type Vinculo = { cargo_id: string; treinamento_id: string }

export function MatrizTreinamentoEditor({
  cargos, treinamentos, vinculos,
}: {
  cargos: Cargo[]
  treinamentos: Treinamento[]
  vinculos: Vinculo[]
}) {
  const [pending, startTransition] = useTransition()
  const [cargoId, setCargoId] = useState(cargos[0]?.id ?? "")

  const mapaInicial = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const v of vinculos) {
      if (!m.has(v.cargo_id)) m.set(v.cargo_id, new Set())
      m.get(v.cargo_id)!.add(v.treinamento_id)
    }
    return m
  }, [vinculos])

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [cargoCarregado, setCargoCarregado] = useState("")
  if (cargoId && cargoId !== cargoCarregado) {
    setSelecionados(new Set(mapaInicial.get(cargoId) ?? []))
    setCargoCarregado(cargoId)
  }

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function salvar() {
    if (!cargoId) return
    startTransition(async () => {
      const r = await salvarMatrizTreinamentoCargo({ cargo_id: cargoId, treinamento_ids: Array.from(selecionados) })
      if ("error" in r) toast.error(r.error?._form?.[0] ?? "Erro ao salvar")
      else toast.success("Matriz do cargo salva.")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Treinamentos obrigatórios por cargo</CardTitle>
        <CardDescription>Selecione o cargo e marque os treinamentos exigidos pela função.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="cargo_id">Cargo</Label>
          <Select value={cargoId} onValueChange={setCargoId}>
            <SelectTrigger id="cargo_id"><SelectValue placeholder={cargos.length ? "Selecione" : "Nenhum cargo"} /></SelectTrigger>
            <SelectContent>{cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {cargoId && (
          <>
            <div className="divide-y rounded-md border">
              {treinamentos.map((t) => (
                <label key={t.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50">
                  <input type="checkbox" checked={selecionados.has(t.id)} onChange={() => toggle(t.id)} className="h-4 w-4" />
                  <span className="text-sm">{t.titulo}{t.nr_referencia ? <span className="text-muted-foreground"> — {t.nr_referencia}</span> : null}</span>
                </label>
              ))}
              {treinamentos.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum treinamento no catálogo.</div>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{selecionados.size} treinamento(s) obrigatório(s)</span>
              <Button type="button" onClick={salvar} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar matriz do cargo
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

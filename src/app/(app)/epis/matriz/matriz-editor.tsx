"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Save, HardHat } from "lucide-react"
import { salvarMatrizCargo } from "./actions"

type Cargo = { id: string; titulo: string }
type Epi = { id: string; descricao: string; ca: string }
type Vinculo = { cargo_id: string; epi_id: string }

export function MatrizEditor({
  cargos, epis, vinculos,
}: {
  cargos: Cargo[]
  epis: Epi[]
  vinculos: Vinculo[]
}) {
  const [pending, startTransition] = useTransition()
  const [cargoId, setCargoId] = useState(cargos[0]?.id ?? "")

  // cargo_id -> Set(epi_id) inicial
  const mapaInicial = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const v of vinculos) {
      if (!m.has(v.cargo_id)) m.set(v.cargo_id, new Set())
      m.get(v.cargo_id)!.add(v.epi_id)
    }
    return m
  }, [vinculos])

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [cargoCarregado, setCargoCarregado] = useState("")

  // (Re)inicializa o set ao trocar de cargo
  if (cargoId && cargoId !== cargoCarregado) {
    setSelecionados(new Set(mapaInicial.get(cargoId) ?? []))
    setCargoCarregado(cargoId)
  }

  function toggle(epiId: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(epiId)) next.delete(epiId)
      else next.add(epiId)
      return next
    })
  }

  function salvar() {
    if (!cargoId) return
    startTransition(async () => {
      const r = await salvarMatrizCargo({
        cargo_id: cargoId,
        itens: Array.from(selecionados).map((epi_id) => ({ epi_id, obrigatorio: true, observacao: null })),
      })
      if ("error" in r) toast.error(r.error?._form?.[0] ?? "Erro ao salvar")
      else toast.success("Matriz do cargo salva.")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><HardHat className="h-4 w-4" /> EPIs obrigatórios por cargo</CardTitle>
        <CardDescription>Selecione o cargo e marque os EPIs exigidos pela função (NR-06).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="cargo">Cargo</Label>
          <Select value={cargoId} onValueChange={setCargoId}>
            <SelectTrigger id="cargo"><SelectValue placeholder={cargos.length ? "Selecione" : "Nenhum cargo"} /></SelectTrigger>
            <SelectContent>
              {cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {cargoId && (
          <>
            <div className="divide-y rounded-md border">
              {epis.map((e) => (
                <label key={e.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50">
                  <input
                    type="checkbox"
                    checked={selecionados.has(e.id)}
                    onChange={() => toggle(e.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{e.descricao} <span className="text-muted-foreground">— CA {e.ca}</span></span>
                </label>
              ))}
              {epis.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum EPI no catálogo.</div>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{selecionados.size} EPI(s) obrigatório(s)</span>
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

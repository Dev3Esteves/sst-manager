"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import { pontoPedido } from "@/lib/estoque/calculos"
import { salvarParametro } from "./actions"

type Epi = { id: string; descricao: string; ca: string | null }
type Local = { id: string; nome: string }

export type ParametroExistente = {
  epi_id: string
  local_id: string | null
  estoque_minimo: number
  estoque_maximo: number | null
  estoque_seguranca: number
  lead_time_dias: number
  consumo_medio: number | null
}

const TODOS_LOCAIS = "__todos__"

export function ParametroForm({
  epis, locais, inicial,
}: {
  epis: Epi[]
  locais: Local[]
  inicial?: ParametroExistente
}) {
  const [pending, startTransition] = useTransition()
  const [epiId, setEpiId] = useState(inicial?.epi_id ?? "")
  const [localId, setLocalId] = useState(inicial?.local_id ?? TODOS_LOCAIS)
  const [minimo, setMinimo] = useState(String(inicial?.estoque_minimo ?? ""))
  const [maximo, setMaximo] = useState(inicial?.estoque_maximo != null ? String(inicial.estoque_maximo) : "")
  const [seguranca, setSeguranca] = useState(String(inicial?.estoque_seguranca ?? ""))
  const [leadTime, setLeadTime] = useState(String(inicial?.lead_time_dias ?? ""))

  // Prévia do ponto de pedido com o consumo médio gravado (se houver).
  const consumoMedio = inicial?.consumo_medio ?? null
  const previaPonto = consumoMedio != null
    ? pontoPedido(consumoMedio, Number(leadTime) || 0, Number(seguranca) || 0)
    : null

  function salvar() {
    startTransition(async () => {
      const r = await salvarParametro({
        epi_id: epiId,
        local_id: localId === TODOS_LOCAIS ? null : localId,
        estoque_minimo: Number(minimo) || 0,
        estoque_maximo: maximo === "" ? null : Number(maximo),
        estoque_seguranca: Number(seguranca) || 0,
        lead_time_dias: Number(leadTime) || 0,
      })
      if ("error" in r) {
        toast.error(r.error?._form?.[0] ?? "Erro ao salvar parâmetro")
      } else {
        toast.success("Parâmetro salvo.")
        if (!inicial) {
          setEpiId("")
          setLocalId(TODOS_LOCAIS)
          setMinimo(""); setMaximo(""); setSeguranca(""); setLeadTime("")
        }
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{inicial ? "Editar parâmetro" : "Novo parâmetro"}</CardTitle>
        <CardDescription>
          Estoque mínimo, máximo, de segurança e lead time alimentam alertas de ruptura e ponto de pedido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="epi">EPI *</Label>
            <Select value={epiId} onValueChange={setEpiId} disabled={!!inicial}>
              <SelectTrigger id="epi"><SelectValue placeholder="Selecione o EPI" /></SelectTrigger>
              <SelectContent>
                {epis.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.descricao}{e.ca ? ` (CA ${e.ca})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Select value={localId} onValueChange={setLocalId} disabled={!!inicial}>
              <SelectTrigger id="local"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_LOCAIS}>Todos os locais (padrão)</SelectItem>
                {locais.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="minimo">Estoque mínimo</Label>
            <Input id="minimo" type="number" min={0} step="any" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maximo">Estoque máximo</Label>
            <Input id="maximo" type="number" min={0} step="any" value={maximo} onChange={(e) => setMaximo(e.target.value)} placeholder="opcional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seguranca">Estoque de segurança</Label>
            <Input id="seguranca" type="number" min={0} step="any" value={seguranca} onChange={(e) => setSeguranca(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead">Lead time (dias)</Label>
            <Input id="lead" type="number" min={0} step={1} value={leadTime} onChange={(e) => setLeadTime(e.target.value)} />
          </div>
        </div>

        {previaPonto != null && (
          <p className="text-xs text-muted-foreground">
            Ponto de pedido estimado: <strong>{previaPonto.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</strong>
            {" "}(consumo médio gravado {consumoMedio?.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}/dia × lead time + segurança).
          </p>
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={salvar} disabled={pending || !epiId}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar parâmetro
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

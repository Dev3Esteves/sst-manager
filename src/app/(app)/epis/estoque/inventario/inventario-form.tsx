"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import { aplicarInventario } from "./actions"

export type ItemSaldo = {
  epi_id: string
  descricao: string
  ca: string | null
  unidade: string | null
  saldo_esperado: number
}

export function InventarioForm({
  localId, itens,
}: {
  localId: string
  itens: ItemSaldo[]
}) {
  const [pending, startTransition] = useTransition()
  const [observacao, setObservacao] = useState("")
  // epi_id -> quantidade contada (string para permitir campo vazio)
  const [contagens, setContagens] = useState<Record<string, string>>({})

  function diferencaDe(item: ItemSaldo): number | null {
    const raw = contagens[item.epi_id]
    if (raw === undefined || raw === "") return null
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    return n - item.saldo_esperado
  }

  function salvar() {
    const aplicar: { epi_id: string; quantidade_contada: number }[] = []
    for (const item of itens) {
      const raw = contagens[item.epi_id]
      if (raw === undefined || raw === "") continue
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0) continue
      if (n === item.saldo_esperado) continue // sem divergência: não ajusta
      aplicar.push({ epi_id: item.epi_id, quantidade_contada: n })
    }
    if (aplicar.length === 0) {
      toast.info("Nenhuma divergência a registrar.")
      return
    }
    startTransition(async () => {
      const r = await aplicarInventario(localId, aplicar, observacao || null)
      if ("error" in r) {
        toast.error(r.error?._form?.[0] ?? "Erro ao aplicar inventário")
      } else {
        toast.success(`${r.ajustes} ajuste(s) registrado(s).`)
        setContagens({})
        setObservacao("")
      }
    })
  }

  const contados = itens.filter((i) => {
    const raw = contagens[i.epi_id]
    return raw !== undefined && raw !== ""
  })
  const divergentes = contados.filter((i) => {
    const d = diferencaDe(i)
    return d !== null && d !== 0
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contagem por EPI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>EPI</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Saldo esperado</TableHead>
              <TableHead className="text-right w-40">Qtd. contada</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item) => {
              const dif = diferencaDe(item)
              return (
                <TableRow key={item.epi_id}>
                  <TableCell>
                    <div className="font-medium">{item.descricao}</div>
                    {item.ca && <div className="text-xs text-muted-foreground font-mono">CA {item.ca}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.unidade ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.saldo_esperado}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      aria-label={`Quantidade contada de ${item.descricao}`}
                      className="text-right"
                      value={contagens[item.epi_id] ?? ""}
                      onChange={(e) =>
                        setContagens((prev) => ({ ...prev, [item.epi_id]: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {dif === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : dif === 0 ? (
                      <span className="text-status-regular">0</span>
                    ) : (
                      <span className={dif > 0 ? "text-status-alerta font-medium" : "text-status-vencido font-medium"}>
                        {dif > 0 ? `+${dif}` : dif}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {itens.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum EPI cadastrado para contagem.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="space-y-2 max-w-xl">
          <Label htmlFor="obs">Observação</Label>
          <textarea
            id="obs"
            rows={2}
            placeholder="Ex.: contagem física de 18/06; conferido por João."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">
            {contados.length} item(ns) contado(s) · {divergentes.length} divergência(s) a registrar
          </span>
          <Button type="button" onClick={salvar} disabled={pending || divergentes.length === 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Registrar ajustes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

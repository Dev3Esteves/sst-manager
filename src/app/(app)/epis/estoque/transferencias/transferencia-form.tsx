"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { TransferenciaInput } from "@/lib/validations/estoque"

type Local = { id: string; nome: string }
type Epi = { id: string; descricao: string; ca: string }
type FormErrors = { _form?: string[] }

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

export function TransferenciaForm({
  locais, epis, saldos, action,
}: {
  locais: Local[]
  epis: Epi[]
  /** Saldo disponível por chave `epi_id|local_id`. */
  saldos: Record<string, number>
  action: (payload: TransferenciaInput) => Promise<{ error?: FormErrors } | { ok: true } | void>
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()

  const [epiId, setEpiId] = useState("")
  const [localOrig, setLocalOrig] = useState("")
  const [localDest, setLocalDest] = useState("")
  const [quantidade, setQuantidade] = useState("1")
  const [observacao, setObservacao] = useState("")

  const saldoOrigem = epiId && localOrig ? saldos[`${epiId}|${localOrig}`] ?? 0 : null

  function handleSubmit() {
    const payload: TransferenciaInput = {
      epi_id: epiId,
      local_orig: localOrig,
      local_dest: localDest,
      quantidade: parseFloat(quantidade) || 0,
      observacao: observacao || null,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result && "error" in result && result.error) {
        setErrors(result.error)
        if (result.error._form?.[0]) toast.error(result.error._form[0])
        return
      }
      toast.success("Transferência registrada.")
      router.push("/epis/estoque/transferencias")
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova transferência</h1>
        <p className="text-muted-foreground">Move EPIs de um local para outro, com baixa atômica.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Dados da transferência</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="epi">EPI *</Label>
            <select id="epi" className={selectCls} value={epiId} onChange={(e) => setEpiId(e.target.value)}>
              <option value="">Selecione</option>
              {epis.map((e) => (
                <option key={e.id} value={e.id}>{e.descricao} — CA {e.ca}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orig">Local de origem *</Label>
            <select id="orig" className={selectCls} value={localOrig} onChange={(e) => setLocalOrig(e.target.value)}>
              <option value="">Selecione</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
            {saldoOrigem != null && (
              <p className="text-xs text-muted-foreground">
                Saldo disponível: <strong className="tabular-nums">{saldoOrigem}</strong>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dest">Local de destino *</Label>
            <select id="dest" className={selectCls} value={localDest} onChange={(e) => setLocalDest(e.target.value)}>
              <option value="">Selecione</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qtd">Quantidade *</Label>
            <Input id="qtd" type="number" min="0" step="0.001" inputMode="decimal"
              value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="obs">Observação</Label>
            <textarea id="obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/epis/estoque/transferencias">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit}
          disabled={pending || !epiId || !localOrig || !localDest}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar transferência
        </Button>
      </div>
    </div>
  )
}

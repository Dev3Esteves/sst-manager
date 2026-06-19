"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { CompraInput } from "@/lib/validations/estoque"

type Fornecedor = { id: string; razao_social: string }
type Local = { id: string; nome: string }
type Epi = { id: string; descricao: string; ca: string }
type FormErrors = { _form?: string[] }

type ItemRow = {
  epi_id: string
  lote: string
  fabricacao: string
  validade: string
  quantidade: string
  custo_unitario: string
}

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

const itemVazio = (): ItemRow => ({
  epi_id: "", lote: "", fabricacao: "", validade: "", quantidade: "1", custo_unitario: "0",
})

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export function CompraForm({
  fornecedores, locais, epis, action,
}: {
  fornecedores: Fornecedor[]
  locais: Local[]
  epis: Epi[]
  action: (payload: CompraInput) => Promise<{ error?: FormErrors } | { ok: true; id: string } | void>
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()

  const [fornecedorId, setFornecedorId] = useState("")
  const [localId, setLocalId] = useState("")
  const [notaFiscal, setNotaFiscal] = useState("")
  const [dataCompra, setDataCompra] = useState(hojeBrasilia())
  const [observacao, setObservacao] = useState("")
  const [itens, setItens] = useState<ItemRow[]>([itemVazio()])

  function addItem() {
    setItens((prev) => [...prev, itemVazio()])
  }
  function removeItem(i: number) {
    setItens((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))
  }
  function updItem(i: number, patch: Partial<ItemRow>) {
    setItens((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  const total = itens.reduce((acc, it) => {
    const q = parseFloat(it.quantidade) || 0
    const c = parseFloat(it.custo_unitario) || 0
    return acc + q * c
  }, 0)

  function handleSubmit() {
    const payload: CompraInput = {
      fornecedor_id: fornecedorId,
      local_id: localId,
      nota_fiscal: notaFiscal || null,
      data_compra: dataCompra,
      observacao: observacao || null,
      itens: itens.map((it) => ({
        epi_id: it.epi_id,
        lote: it.lote || null,
        fabricacao: it.fabricacao || null,
        validade: it.validade || null,
        quantidade: parseFloat(it.quantidade) || 0,
        custo_unitario: parseFloat(it.custo_unitario) || 0,
      })),
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result && "error" in result && result.error) {
        setErrors(result.error)
        if (result.error._form?.[0]) toast.error(result.error._form[0])
        return
      }
      if (result && "ok" in result && result.ok) {
        toast.success("Compra salva como rascunho.")
        router.push(`/epis/estoque/compras/${result.id}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova compra de EPIs</h1>
        <p className="text-muted-foreground">
          Salva como rascunho. As entradas no estoque só ocorrem ao confirmar a compra.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Dados da compra</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor *</Label>
            <select id="fornecedor" className={selectCls} value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}>
              <option value="">Selecione</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.razao_social}</option>
              ))}
            </select>
            {fornecedores.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum fornecedor cadastrado. Cadastre uma empresa com o papel &quot;Fornecedor&quot;.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local de destino *</Label>
            <select id="local" className={selectCls} value={localId}
              onChange={(e) => setLocalId(e.target.value)}>
              <option value="">Selecione</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nf">Nota fiscal</Label>
            <Input id="nf" value={notaFiscal} onChange={(e) => setNotaFiscal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data da compra *</Label>
            <Input id="data" type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="obs">Observação</Label>
            <textarea id="obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Itens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {itens.map((it, i) => (
            <div key={i} className="grid gap-3 md:grid-cols-12 items-end rounded-md border p-3">
              <div className="space-y-1 md:col-span-4">
                <Label htmlFor={`it-${i}-epi`} className="text-xs">EPI *</Label>
                <select id={`it-${i}-epi`} className={selectCls} value={it.epi_id}
                  onChange={(e) => updItem(i, { epi_id: e.target.value })}>
                  <option value="">Selecione</option>
                  {epis.map((e) => (
                    <option key={e.id} value={e.id}>{e.descricao} — CA {e.ca}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor={`it-${i}-lote`} className="text-xs">Lote</Label>
                <Input id={`it-${i}-lote`} value={it.lote} onChange={(e) => updItem(i, { lote: e.target.value })} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor={`it-${i}-fab`} className="text-xs">Fabricação</Label>
                <Input id={`it-${i}-fab`} type="date" value={it.fabricacao}
                  onChange={(e) => updItem(i, { fabricacao: e.target.value })} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor={`it-${i}-val`} className="text-xs">Validade</Label>
                <Input id={`it-${i}-val`} type="date" value={it.validade}
                  onChange={(e) => updItem(i, { validade: e.target.value })} />
              </div>
              <div className="md:col-span-2" />
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor={`it-${i}-qtd`} className="text-xs">Quantidade *</Label>
                <Input id={`it-${i}-qtd`} type="number" min="0" step="0.001" inputMode="decimal"
                  value={it.quantidade} onChange={(e) => updItem(i, { quantidade: e.target.value })} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor={`it-${i}-custo`} className="text-xs">Custo unitário (R$) *</Label>
                <Input id={`it-${i}-custo`} type="number" min="0" step="0.0001" inputMode="decimal"
                  value={it.custo_unitario} onChange={(e) => updItem(i, { custo_unitario: e.target.value })} />
              </div>
              <div className="space-y-1 md:col-span-3">
                <Label className="text-xs">Subtotal</Label>
                <p className="h-9 flex items-center text-sm tabular-nums">
                  {moeda.format((parseFloat(it.quantidade) || 0) * (parseFloat(it.custo_unitario) || 0))}
                </p>
              </div>
              <div className="md:col-span-5 flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}
                  disabled={itens.length === 1} aria-label="Remover item">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4" /> Adicionar item
            </Button>
            <p className="text-sm">
              Total: <strong className="tabular-nums">{moeda.format(total)}</strong>
            </p>
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
          <Link href="/epis/estoque/compras">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar rascunho
        </Button>
      </div>
    </div>
  )
}

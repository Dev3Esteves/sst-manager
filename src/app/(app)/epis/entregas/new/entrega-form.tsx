"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SignatureCanvas } from "@/components/signature-canvas"
import { Loader2 } from "lucide-react"
import { MOTIVOS_LABEL, type EpiEntregaInput } from "@/lib/validations/epi-entrega"

type Colaborador = { id: string; nome_completo: string }
type Epi = { id: string; descricao: string; ca: string; ca_validade: string | null }
type FormErrors = { _form?: string[] }

export function EntregaForm({
  colaboradores, epis, action,
}: {
  colaboradores: Colaborador[]
  epis: Epi[]
  action: (payload: EpiEntregaInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [colabId, setColabId] = useState("")
  const [epiId, setEpiId] = useState("")
  const [dataEntrega, setDataEntrega] = useState(new Date().toISOString().slice(0, 10))
  const [quantidade, setQuantidade] = useState(1)
  const [motivo, setMotivo] = useState<string>("primeiro_fornecimento")
  const [observacoes, setObservacoes] = useState("")
  const [assinatura, setAssinatura] = useState<string | null>(null)

  const epiSelecionado = epis.find(e => e.id === epiId)

  function handleSubmit() {
    const payload: EpiEntregaInput = {
      colaborador_id: colabId,
      epi_id: epiId,
      data_entrega: dataEntrega,
      quantidade,
      motivo: motivo as EpiEntregaInput["motivo"],
      observacoes: observacoes || null,
      assinatura_data_url: assinatura,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova entrega de EPI</h1>
        <p className="text-muted-foreground">O colaborador deve assinar no campo abaixo ao receber o EPI.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">1. Dados da entrega</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <Select value={colabId} onValueChange={setColabId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {colaboradores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>EPI *</Label>
            <Select value={epiId} onValueChange={setEpiId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {epis.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.descricao} — CA {e.ca}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {epiSelecionado?.ca_validade && (
              <p className="text-xs text-muted-foreground">Validade do CA: {epiSelecionado.ca_validade}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="de">Data da entrega *</Label>
            <Input id="de" type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qtd">Quantidade</Label>
            <Input id="qtd" type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(+e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Motivo *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MOTIVOS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <textarea
              id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Assinatura do colaborador</CardTitle>
          <CardDescription>O colaborador declara ter recebido o EPI em perfeito estado e estar ciente de sua obrigação de uso.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignatureCanvas onChange={setAssinatura} />
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/epis/entregas">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !colabId || !epiId}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar entrega
        </Button>
      </div>
    </div>
  )
}

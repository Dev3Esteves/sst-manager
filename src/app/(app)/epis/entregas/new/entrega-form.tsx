"use client"

import Link from "next/link"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
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

type EntregaExistente = {
  id: string
  colaborador_id: string
  epi_id: string
  data_entrega: string
  quantidade: number
  motivo: string | null
  observacoes: string | null
}

export function EntregaForm({
  colaboradores, epis, action, entrega, obrigatoriosPorColaborador = {},
}: {
  colaboradores: Colaborador[]
  epis: Epi[]
  action: (payload: EpiEntregaInput) => Promise<{ error?: FormErrors } | void>
  entrega?: EntregaExistente
  obrigatoriosPorColaborador?: Record<string, string[]>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [colabId, setColabId] = useState(entrega?.colaborador_id ?? "")
  const [epiId, setEpiId] = useState(entrega?.epi_id ?? "")
  const [dataEntrega, setDataEntrega] = useState(entrega?.data_entrega ?? hojeBrasilia())
  const [quantidade, setQuantidade] = useState(entrega?.quantidade ?? 1)
  const [motivo, setMotivo] = useState<string>(entrega?.motivo ?? "primeiro_fornecimento")
  const [observacoes, setObservacoes] = useState(entrega?.observacoes ?? "")
  const [assinatura, setAssinatura] = useState<string | null>(null)
  const [ciencia, setCiencia] = useState(false)

  const epiSelecionado = epis.find(e => e.id === epiId)
  const obrigatorios = colabId ? (obrigatoriosPorColaborador[colabId] ?? []) : []
  // Na edição, a assinatura/ciência já foram coletadas no registro original.
  const podeSalvar = !!entrega || (!!assinatura && ciencia)

  function handleSubmit() {
    const payload: EpiEntregaInput = {
      colaborador_id: colabId,
      epi_id: epiId,
      data_entrega: dataEntrega,
      quantidade,
      motivo: motivo as EpiEntregaInput["motivo"],
      observacoes: observacoes || null,
      assinatura_data_url: assinatura,
      ciencia,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{entrega ? "Editar entrega de EPI" : "Nova entrega de EPI"}</h1>
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
          {obrigatorios.length > 0 && (
            <div className="md:col-span-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-primary mb-1">EPIs obrigatórios do cargo</p>
              <p className="text-muted-foreground text-xs">{obrigatorios.join(" · ")}</p>
            </div>
          )}
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
        <CardContent className="space-y-3">
          {!entrega && <SignatureCanvas onChange={setAssinatura} />}
          {entrega && <p className="text-sm text-muted-foreground">Assinatura coletada no registro original.</p>}
          {!entrega && (
            <label className="flex items-start gap-2 text-sm cursor-pointer rounded-md border p-3">
              <input type="checkbox" checked={ciencia} onChange={(e) => setCiencia(e.target.checked)} className="h-4 w-4 mt-0.5" />
              <span>
                <strong>Termo de ciência (NR-6.6.1):</strong> o colaborador declara ter recebido o(s) EPI(s) em
                perfeito estado, foi orientado sobre o uso correto, guarda e conservação, e está ciente da
                obrigatoriedade de uso.
              </span>
            </label>
          )}
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex items-center gap-3 justify-end">
        {!entrega && !podeSalvar && (
          <span className="text-xs text-muted-foreground">Assine e marque o termo de ciência para registrar.</span>
        )}
        <Button type="button" variant="outline" asChild>
          <Link href="/epis/entregas">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !colabId || !epiId || !podeSalvar}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {entrega ? "Salvar" : "Registrar entrega"}
        </Button>
      </div>
    </div>
  )
}

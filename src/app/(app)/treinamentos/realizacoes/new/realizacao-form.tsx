"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type Colaborador = { id: string; nome_completo: string }
type Treinamento = { id: string; titulo: string; nr_referencia?: string | null; validade_meses?: number | null }
type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function RealizacaoForm({
  colaboradores, treinamentos, action,
}: {
  colaboradores: Colaborador[]
  treinamentos: Treinamento[]
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [colabId, setColabId] = useState("")
  const [trnId, setTrnId] = useState("")

  const trnSelecionado = treinamentos.find(t => t.id === trnId)

  async function handleSubmit(formData: FormData) {
    formData.set("colaborador_id", colabId)
    formData.set("treinamento_id", trnId)
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar realização de treinamento</CardTitle>
          <CardDescription>O vencimento é calculado automaticamente pela validade do treinamento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="colaborador_id">Colaborador *</Label>
            <Select value={colabId} onValueChange={setColabId}>
              <SelectTrigger id="colaborador_id"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {colaboradores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="treinamento_id">Treinamento *</Label>
            <Select value={trnId} onValueChange={setTrnId}>
              <SelectTrigger id="treinamento_id"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {treinamentos.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.titulo}{t.nr_referencia ? ` — ${t.nr_referencia}` : ""}
                    {t.validade_meses ? ` (${t.validade_meses}m)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {trnSelecionado?.validade_meses != null && (
              <p className="text-xs text-muted-foreground">
                Validade: {trnSelecionado.validade_meses} {trnSelecionado.validade_meses === 0 ? "— sem vencimento" : "meses"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_realizacao">Data de realização *</Label>
            <Input id="data_realizacao" name="data_realizacao" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nota_avaliacao">Nota (0-10)</Label>
            <Input id="nota_avaliacao" name="nota_avaliacao" type="number" step="0.1" min="0" max="10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instrutor">Instrutor</Label>
            <Input id="instrutor" name="instrutor" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entidade">Entidade</Label>
            <Input id="entidade" name="entidade" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="local">Local</Label>
            <Input id="local" name="local" />
          </div>
          {errors._form && <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>}
        </CardContent>
      </Card>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/treinamentos/realizacoes">Cancelar</Link></Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar
        </Button>
      </div>
    </form>
  )
}

"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { TIPOS_EPI } from "@/lib/validations/epi"

type Epi = {
  id?: string
  descricao: string
  ca: string
  ca_validade?: string | null
  fabricante?: string | null
  tipo?: string | null
}
type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function EpiForm({
  epi, action,
}: {
  epi?: Epi
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState(epi?.tipo || "")

  async function handleSubmit(formData: FormData) {
    if (tipo) formData.set("tipo", tipo)
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{epi ? "Editar EPI" : "Novo EPI"}</CardTitle>
          <CardDescription>A validade do CA alimenta automaticamente o painel de vencimentos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" name="descricao" defaultValue={epi?.descricao} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca">CA *</Label>
            <Input id="ca" name="ca" defaultValue={epi?.ca} required placeholder="12345" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca_validade">Validade do CA</Label>
            <Input id="ca_validade" name="ca_validade" type="date" defaultValue={epi?.ca_validade ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fabricante">Fabricante</Label>
            <Input id="fabricante" name="fabricante" defaultValue={epi?.fabricante ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {TIPOS_EPI.map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors._form && <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>}
        </CardContent>
      </Card>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/epis">Cancelar</Link></Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {epi ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

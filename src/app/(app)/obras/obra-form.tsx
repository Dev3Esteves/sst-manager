"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { UFS } from "@/lib/validations/obra"

type Obra = {
  id?: string
  empresa_id: string
  contratante_id?: string | null
  nome: string
  codigo?: string | null
  cidade?: string | null
  uf?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  ativa: boolean
}

type EmpresaOpcao = { id: string; razao_social: string }
type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function ObraForm({
  obra, donas, contratantes, action,
}: {
  obra?: Obra
  donas: EmpresaOpcao[]
  contratantes: EmpresaOpcao[]
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [empresaId, setEmpresaId] = useState(obra?.empresa_id || donas[0]?.id || "")
  const [contratanteId, setContratanteId] = useState(obra?.contratante_id || "")
  const [uf, setUf] = useState(obra?.uf || "")

  async function handleSubmit(formData: FormData) {
    formData.set("empresa_id", empresaId)
    formData.set("contratante_id", contratanteId || "none")
    formData.set("uf", uf || "none")
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{obra ? "Editar obra" : "Nova obra"}</CardTitle>
          <CardDescription>
            Projeto/obra em andamento. Usado no cabeçalho de OS NR-01, Ficha de EPI e
            outros documentos oficiais, além de servir para alocar colaboradores em campo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome">Nome da obra *</Label>
            <Input
              id="nome" name="nome" defaultValue={obra?.nome}
              placeholder="DANTE / RACIONAL" required
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa_id">Empresa dona *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger id="empresa_id"><SelectValue /></SelectTrigger>
              <SelectContent>
                {donas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Quem executa a obra.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contratante_id">Contratante</Label>
            <Select
              value={contratanteId || "none"}
              onValueChange={(v) => setContratanteId(v === "none" ? "" : v)}
            >
              <SelectTrigger id="contratante_id"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— sem contratante —</SelectItem>
                {contratantes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Cliente para quem a obra é executada.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">Código interno</Label>
            <Input id="codigo" name="codigo" defaultValue={obra?.codigo ?? ""} placeholder="OBR-001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" name="cidade" defaultValue={obra?.cidade ?? ""} placeholder="Hortolândia" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Select value={uf || "none"} onValueChange={(v) => setUf(v === "none" ? "" : v)}>
              <SelectTrigger id="uf"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_inicio">Início</Label>
            <Input id="data_inicio" name="data_inicio" type="date" defaultValue={obra?.data_inicio ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_fim">Fim previsto</Label>
            <Input id="data_fim" name="data_fim" type="date" defaultValue={obra?.data_fim ?? ""} />
          </div>
          <div className="flex items-center space-x-2 md:col-span-2 pt-2">
            <input
              type="checkbox"
              id="ativa"
              name="ativa"
              defaultChecked={obra?.ativa ?? true}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="ativa">Obra ativa</Label>
          </div>
          {errors._form && (
            <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/obras">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {obra ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

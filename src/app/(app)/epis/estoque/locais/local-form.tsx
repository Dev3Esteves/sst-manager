"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { LocalInput } from "@/lib/validations/estoque"

type Obra = { id: string; nome: string }
type LocalExistente = {
  id: string
  nome: string
  tipo: "central" | "obra"
  obra_id: string | null
  ativo: boolean
}
type FormErrors = { _form?: string[] }

export function LocalForm({
  obras, criar, atualizar, local, onDone,
}: {
  obras: Obra[]
  criar: (payload: LocalInput) => Promise<{ error?: FormErrors } | { ok: true }>
  atualizar: (id: string, payload: LocalInput) => Promise<{ error?: FormErrors } | { ok: true }>
  /** Quando presente, o form edita este local em vez de criar. */
  local?: LocalExistente
  /** Callback após sucesso (ex.: fechar/limpar). */
  onDone?: () => void
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [nome, setNome] = useState(local?.nome ?? "")
  const [tipo, setTipo] = useState<"central" | "obra">(local?.tipo ?? "central")
  const [obraId, setObraId] = useState(local?.obra_id ?? "")
  const [ativo, setAtivo] = useState(local?.ativo ?? true)

  function handleSubmit() {
    setErrors({})
    const payload: LocalInput = {
      nome: nome.trim(),
      tipo,
      obra_id: tipo === "obra" ? obraId || null : null,
      ativo,
    }
    startTransition(async () => {
      const result = local ? await atualizar(local.id, payload) : await criar(payload)
      if ("error" in result && result.error) {
        setErrors(result.error)
        return
      }
      toast.success(local ? "Local atualizado." : "Local criado.")
      if (!local) {
        setNome("")
        setTipo("central")
        setObraId("")
        setAtivo(true)
      }
      onDone?.()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{local ? "Editar local" : "Novo local de estoque"}</CardTitle>
        <CardDescription>
          Centrais (almoxarifado) ou locais de obra. Para criar um local de obra, escolha o tipo
          &ldquo;Obra&rdquo; e selecione a obra.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome" value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Almoxarifado central"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select value={tipo} onValueChange={(v) => { setTipo(v as "central" | "obra"); if (v === "central") setObraId("") }}>
            <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="central">Central</SelectItem>
              <SelectItem value="obra">Obra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {tipo === "obra" && (
          <div className="space-y-2">
            <Label htmlFor="obra_id">Obra *</Label>
            <Select value={obraId} onValueChange={setObraId}>
              <SelectTrigger id="obra_id"><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
              <SelectContent>
                {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center space-x-2 md:col-span-2 pt-1">
          <input
            type="checkbox" id="ativo" checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="ativo">Local ativo</Label>
        </div>
        {errors._form && (
          <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>
        )}
      </CardContent>
      <div className="flex justify-end gap-2 px-6 pb-6">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={pending || !nome.trim() || (tipo === "obra" && !obraId)}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {local ? "Salvar" : "Criar local"}
        </Button>
      </div>
    </Card>
  )
}

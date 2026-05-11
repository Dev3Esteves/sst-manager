"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

type Ghe = {
  id?: string
  codigo?: string
  descricao?: string
  funcao_posicao?: string | null
  area_identificacao?: string | null
  caracterizacao_atividades?: string | null
  local_trabalho?: string | null
  num_empregados_expostos?: number | null
  ordem?: number
}

type ActionResult = { error?: Record<string, string[]> } | void

export function GheForm({
  pgrId,
  ghe,
  action,
  onDelete,
  modo,
}: {
  pgrId: string
  ghe?: Ghe
  action: (formData: FormData) => Promise<ActionResult>
  onDelete?: () => Promise<ActionResult>
  modo: "criar" | "editar"
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSubmit(formData: FormData) {
    setErrors({})
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setErrors(result.error)
    })
  }

  function handleDelete() {
    if (!onDelete) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      const result = await onDelete()
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="pgr_id" value={pgrId} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          {modo === "criar" ? "Novo GHE" : `Editar ${ghe?.codigo ?? "GHE"}`}
        </h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          {onDelete && modo === "editar" && (
            <Button
              type="button"
              variant={confirmDelete ? "destructive" : "outline"}
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? "Confirmar exclusão" : "Excluir GHE"}
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : modo === "criar" ? "Criar GHE" : "Salvar"}
          </Button>
        </div>
      </div>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form.join(", ")}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação do GHE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                name="codigo"
                defaultValue={ghe?.codigo ?? ""}
                placeholder="GHE 01"
                required
              />
              {errors.codigo && <p className="text-xs text-destructive mt-1">{errors.codigo[0]}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                name="descricao"
                defaultValue={ghe?.descricao ?? ""}
                placeholder="Ex.: ADMINISTRAÇÃO"
                required
              />
              {errors.descricao && (
                <p className="text-xs text-destructive mt-1">{errors.descricao[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="funcao_posicao">Função / Posição</Label>
              <Input
                id="funcao_posicao"
                name="funcao_posicao"
                defaultValue={ghe?.funcao_posicao ?? ""}
                placeholder="Ex.: Engenharia / Operacional"
              />
            </div>
            <div>
              <Label htmlFor="area_identificacao">Área de identificação</Label>
              <Input
                id="area_identificacao"
                name="area_identificacao"
                defaultValue={ghe?.area_identificacao ?? ""}
                placeholder="Ex.: CANTEIRO OPERACIONAL"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="local_trabalho">Local de trabalho</Label>
              <Input
                id="local_trabalho"
                name="local_trabalho"
                defaultValue={ghe?.local_trabalho ?? ""}
                placeholder="Escritório / Campo"
              />
            </div>
            <div>
              <Label htmlFor="num_empregados_expostos">Nº empregados expostos</Label>
              <Input
                id="num_empregados_expostos"
                name="num_empregados_expostos"
                type="number"
                min={0}
                defaultValue={ghe?.num_empregados_expostos ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="ordem">Ordem de exibição</Label>
              <Input
                id="ordem"
                name="ordem"
                type="number"
                min={0}
                defaultValue={ghe?.ordem ?? 0}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="caracterizacao_atividades">Caracterização das atividades</Label>
            <textarea
              id="caracterizacao_atividades"
              name="caracterizacao_atividades"
              rows={3}
              defaultValue={ghe?.caracterizacao_atividades ?? ""}
              placeholder="Atividades administrativas e operacionais, planejamento de obras, realizadas no container e no campo, e acompanhamento de obras."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

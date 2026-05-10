"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import {
  RISCO_CATEGORIA,
  RISCO_CATEGORIA_LABEL,
  TIPO_EXPOSICAO,
  TIPO_EXPOSICAO_LABEL,
  CATEGORIA_RISCO,
  CATEGORIA_RISCO_LABEL,
  type RiscoCategoria,
  type TipoExposicao,
  type CategoriaRisco,
} from "@/lib/validations/pgr"

type Risco = {
  id?: string
  categoria?: RiscoCategoria
  agente_ambiental?: string
  codigo_esocial?: string | null
  fontes_geradoras?: string | null
  trajetoria?: string | null
  via_ingresso?: string | null
  possiveis_danos?: string | null
  tipo_exposicao?: TipoExposicao | null
  categoria_risco?: CategoriaRisco | null
  observacoes?: string | null
  ordem?: number
}

type ActionResult = { error?: Record<string, string[]> } | void

export function RiscoForm({
  risco,
  gheLabel,
  action,
  onDelete,
  modo,
}: {
  risco?: Risco
  gheLabel: string
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {modo === "criar" ? "Novo risco" : "Editar risco"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            GHE: <span className="font-mono">{gheLabel}</span>
          </p>
        </div>
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
              {confirmDelete ? "Confirmar exclusão" : "Excluir"}
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : modo === "criar" ? "Criar risco" : "Salvar"}
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
          <CardTitle className="text-base">Identificação do agente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select name="categoria" defaultValue={risco?.categoria ?? "acidente"} required>
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISCO_CATEGORIA.map((c) => (
                    <SelectItem key={c} value={c}>
                      {RISCO_CATEGORIA_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="agente_ambiental">Agente ambiental *</Label>
              <Input
                id="agente_ambiental"
                name="agente_ambiental"
                defaultValue={risco?.agente_ambiental ?? ""}
                placeholder="Ex.: RUÍDO, QUEDA DE ALTURA, POEIRA MINERAL"
                required
              />
              {errors.agente_ambiental && (
                <p className="text-xs text-destructive mt-1">{errors.agente_ambiental[0]}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="codigo_esocial">Código eSocial (Tabela 24)</Label>
            <Input
              id="codigo_esocial"
              name="codigo_esocial"
              defaultValue={risco?.codigo_esocial ?? ""}
              placeholder="Ex.: 02.01.001"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Validação contra catálogo oficial da Tabela 24 entra em chunk futuro
              (Sprint A.4).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Caracterização da exposição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fontes_geradoras">Fontes geradoras</Label>
            <textarea
              id="fontes_geradoras"
              name="fontes_geradoras"
              rows={2}
              defaultValue={risco?.fontes_geradoras ?? ""}
              placeholder="Ex.: Veículos e máquinas na área interna"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="trajetoria">Trajetória / propagação</Label>
              <Input
                id="trajetoria"
                name="trajetoria"
                defaultValue={risco?.trajetoria ?? ""}
                placeholder="Ex.: Ambiente, Contato direto, Externa"
              />
            </div>
            <div>
              <Label htmlFor="via_ingresso">Via de ingresso</Label>
              <Input
                id="via_ingresso"
                name="via_ingresso"
                defaultValue={risco?.via_ingresso ?? ""}
                placeholder="Ex.: Ar, Ambiente, Pele, Inalação"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="possiveis_danos">Possíveis danos à saúde</Label>
            <textarea
              id="possiveis_danos"
              name="possiveis_danos"
              rows={3}
              defaultValue={risco?.possiveis_danos ?? ""}
              placeholder="Ex.: Trauma acústico, perda auditiva induzida por ruído, stress, fadiga, irritabilidade"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classificação do risco</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="tipo_exposicao">Tipo de exposição</Label>
              <Select
                name="tipo_exposicao"
                defaultValue={risco?.tipo_exposicao ?? undefined}
              >
                <SelectTrigger id="tipo_exposicao">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_EXPOSICAO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_EXPOSICAO_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="categoria_risco">Categoria final do risco</Label>
              <Select
                name="categoria_risco"
                defaultValue={risco?.categoria_risco ?? undefined}
              >
                <SelectTrigger id="categoria_risco">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIA_RISCO.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORIA_RISCO_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Médio: revisão a cada 3 anos. Alto/Muito Alto: revisão a cada 5 anos.
              </p>
            </div>
            <div>
              <Label htmlFor="ordem">Ordem</Label>
              <Input
                id="ordem"
                name="ordem"
                type="number"
                min={0}
                defaultValue={risco?.ordem ?? 0}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={2}
              defaultValue={risco?.observacoes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

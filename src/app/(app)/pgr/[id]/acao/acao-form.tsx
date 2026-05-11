"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { ACAO_STATUS, ACAO_STATUS_LABEL, type AcaoStatus } from "@/lib/validations/pgr"

type Acao = {
  id?: string
  numero_item?: number
  o_que?: string
  quem?: string | null
  onde?: string | null
  quando?: string | null
  por_que?: string | null
  como?: string | null
  status?: AcaoStatus
  observacoes?: string | null
}

type ActionResult = { error?: Record<string, string[]> } | void

export function AcaoForm({
  acao,
  proximoNumeroItem,
  action,
  onDelete,
  modo,
}: {
  acao?: Acao
  proximoNumeroItem?: number
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
        <h2 className="text-xl font-bold tracking-tight">
          {modo === "criar"
            ? "Nova ação do cronograma"
            : `Editar ação #${acao?.numero_item ?? ""}`}
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
              {confirmDelete ? "Confirmar exclusão" : "Excluir"}
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : modo === "criar" ? "Criar ação" : "Salvar"}
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
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="numero_item">Nº do item *</Label>
              <Input
                id="numero_item"
                name="numero_item"
                type="number"
                min={1}
                defaultValue={acao?.numero_item ?? proximoNumeroItem ?? 1}
                required
              />
              {errors.numero_item && (
                <p className="text-xs text-destructive mt-1">{errors.numero_item[0]}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={acao?.status ?? "planejado"}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACAO_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ACAO_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">5W1H</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="o_que">O que fazer? *</Label>
            <textarea
              id="o_que"
              name="o_que"
              rows={2}
              defaultValue={acao?.o_que ?? ""}
              placeholder="Ex.: Emissão do Anexo III — Reconhecimento e Classificação da Exposição aos Riscos Ambientais"
              required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {errors.o_que && <p className="text-xs text-destructive mt-1">{errors.o_que[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="quem">Quem?</Label>
              <Input
                id="quem"
                name="quem"
                defaultValue={acao?.quem ?? ""}
                placeholder="SMS, TODOS, SESMT..."
              />
            </div>
            <div>
              <Label htmlFor="onde">Onde?</Label>
              <Input
                id="onde"
                name="onde"
                defaultValue={acao?.onde ?? ""}
                placeholder="MATRIZ, Obra X, Nas Gerências..."
              />
            </div>
            <div>
              <Label htmlFor="quando">Quando?</Label>
              <Input
                id="quando"
                name="quando"
                defaultValue={acao?.quando ?? ""}
                placeholder="03/2026, PERMANENTE, PERIODICO..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="por_que">Por quê?</Label>
            <textarea
              id="por_que"
              name="por_que"
              rows={2}
              defaultValue={acao?.por_que ?? ""}
              placeholder="Ex.: Atender legislação e garantir eficácia do PGR"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <Label htmlFor="como">Como?</Label>
            <textarea
              id="como"
              name="como"
              rows={2}
              defaultValue={acao?.como ?? ""}
              placeholder="Ex.: Levantamento de campo e experiências anteriores"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={2}
              defaultValue={acao?.observacoes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

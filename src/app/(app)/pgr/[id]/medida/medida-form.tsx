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
  TIPO_MEDIDA,
  TIPO_MEDIDA_LABEL,
  NIVEL_NIOSH_LABEL,
  type TipoMedida,
} from "@/lib/validations/pgr"

type Ghe = { id: string; codigo: string; descricao: string }

type Medida = {
  id?: string
  pgr_ghe_id?: string | null
  agente_ambiental?: string | null
  tipo_medida?: TipoMedida
  nivel_niosh?: number | null
  acao?: string
  detalhamento?: string | null
  abrangencia?: string | null
  periodicidade?: string | null
  status?: string
  ordem?: number
}

type ActionResult = { error?: Record<string, string[]> } | void

const STATUS_OPCOES = [
  { value: "planejado", label: "Planejado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "implantado", label: "Implantado" },
  { value: "eventual", label: "Eventual" },
  { value: "pendente", label: "Pendente" },
  { value: "cancelado", label: "Cancelado" },
]

export function MedidaForm({
  medida,
  ghes,
  action,
  onDelete,
  modo,
}: {
  medida?: Medida
  ghes: Ghe[]
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
          {modo === "criar" ? "Nova medida de controle" : "Editar medida"}
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
            {pending ? "Salvando..." : modo === "criar" ? "Criar medida" : "Salvar"}
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
          <CardTitle className="text-base">Aplicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pgr_ghe_id">GHE (opcional — vazio = todos)</Label>
              <Select
                name="pgr_ghe_id"
                defaultValue={medida?.pgr_ghe_id ?? "none"}
              >
                <SelectTrigger id="pgr_ghe_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aplicável a todos os GHEs</SelectItem>
                  {ghes.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.codigo} — {g.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="agente_ambiental">Agente ambiental</Label>
              <Input
                id="agente_ambiental"
                name="agente_ambiental"
                defaultValue={medida?.agente_ambiental ?? ""}
                placeholder="Ex.: RUÍDO, POEIRA MINERAL — opcional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classificação da medida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tipo_medida">Tipo *</Label>
              <Select name="tipo_medida" defaultValue={medida?.tipo_medida ?? "coletiva"} required>
                <SelectTrigger id="tipo_medida">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_MEDIDA.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_MEDIDA_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nivel_niosh">Nível NIOSH (1=mais eficaz, 5=último recurso)</Label>
              <Select
                name="nivel_niosh"
                defaultValue={medida?.nivel_niosh ? String(medida.nivel_niosh) : "none"}
              >
                <SelectTrigger id="nivel_niosh">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Não classificado</SelectItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} — {NIVEL_NIOSH_LABEL[n]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                ISO 45001 cl. 8.1.2 + NR-1: priorize eliminação &gt; substituição &gt;
                engenharia &gt; administrativa &gt; EPI.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento da ação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="acao">Ação *</Label>
            <Input
              id="acao"
              name="acao"
              defaultValue={medida?.acao ?? ""}
              placeholder="Ex.: Uso de EPI, Implantação de ventilação local exaustora"
              required
            />
            {errors.acao && <p className="text-xs text-destructive mt-1">{errors.acao[0]}</p>}
          </div>

          <div>
            <Label htmlFor="detalhamento">Detalhamento</Label>
            <textarea
              id="detalhamento"
              name="detalhamento"
              rows={2}
              defaultValue={medida?.detalhamento ?? ""}
              placeholder="Ex.: Uso de protetor auricular tipo plug"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="abrangencia">Abrangência</Label>
              <Input
                id="abrangencia"
                name="abrangencia"
                defaultValue={medida?.abrangencia ?? ""}
                placeholder="Ex.: Quando ultrapassar 80dB"
              />
            </div>
            <div>
              <Label htmlFor="periodicidade">Periodicidade</Label>
              <Input
                id="periodicidade"
                name="periodicidade"
                defaultValue={medida?.periodicidade ?? ""}
                placeholder="Permanente, Quando necessário..."
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={medida?.status ?? "planejado"}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPCOES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="ordem">Ordem de exibição</Label>
            <Input
              id="ordem"
              name="ordem"
              type="number"
              min={0}
              defaultValue={medida?.ordem ?? 0}
              className="md:w-32"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

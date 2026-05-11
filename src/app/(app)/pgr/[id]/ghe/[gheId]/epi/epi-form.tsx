"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { EPI_USO, EPI_USO_LABEL, type EpiUso } from "@/lib/validations/pgr"

type EpiCatalog = { id: string; descricao: string; ca: string | null }

type EpiGhe = {
  id?: string
  epi_nome?: string
  epi_id?: string | null
  uso?: EpiUso
  observacao?: string | null
  ordem?: number
}

type ActionResult = { error?: Record<string, string[]> } | void

export function EpiForm({
  epiGhe,
  catalogo,
  gheLabel,
  action,
  onDelete,
  modo,
}: {
  epiGhe?: EpiGhe
  catalogo: EpiCatalog[]
  gheLabel: string
  action: (formData: FormData) => Promise<ActionResult>
  onDelete?: () => Promise<ActionResult>
  modo: "criar" | "editar"
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [epiNome, setEpiNome] = useState(epiGhe?.epi_nome ?? "")
  const [epiIdSel, setEpiIdSel] = useState(epiGhe?.epi_id ?? "none")

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

  function handleSelectEpiCadastrado(value: string) {
    setEpiIdSel(value)
    if (value !== "none") {
      const epi = catalogo.find((e) => e.id === value)
      if (epi) setEpiNome(epi.descricao)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {modo === "criar" ? "Novo EPI no GHE" : "Editar EPI do GHE"}
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
            {pending ? "Salvando..." : modo === "criar" ? "Adicionar" : "Salvar"}
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
          <CardTitle className="text-base">Identificação do EPI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="epi_id">EPI cadastrado (opcional)</Label>
            <Select
              name="epi_id"
              value={epiIdSel}
              onValueChange={handleSelectEpiCadastrado}
            >
              <SelectTrigger id="epi_id">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— EPI livre (não cadastrado)</SelectItem>
                {catalogo.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.descricao}
                    {e.ca ? ` (CA ${e.ca})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Linkar a um EPI cadastrado em /epis facilita reuso e mantém CA
              consistente. Selecionando, o nome é preenchido automaticamente.
            </p>
          </div>

          <div>
            <Label htmlFor="epi_nome">Nome do EPI *</Label>
            <Input
              id="epi_nome"
              name="epi_nome"
              value={epiNome}
              onChange={(e) => setEpiNome(e.target.value)}
              placeholder="Ex.: Capacete, Luva Nitrílica, Protetor Auditivo Plug"
              required
            />
            {errors.epi_nome && (
              <p className="text-xs text-destructive mt-1">{errors.epi_nome[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aplicação no GHE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="uso">Uso *</Label>
              <Select name="uso" defaultValue={epiGhe?.uso ?? "permanente"} required>
                <SelectTrigger id="uso">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EPI_USO.map((u) => (
                    <SelectItem key={u} value={u}>
                      {EPI_USO_LABEL[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Permanente (P), Eventual (E) ou Atividade específica.
              </p>
            </div>
            <div>
              <Label htmlFor="ordem">Ordem de exibição</Label>
              <Input
                id="ordem"
                name="ordem"
                type="number"
                min={0}
                defaultValue={epiGhe?.ordem ?? 0}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacao">Observação</Label>
            <textarea
              id="observacao"
              name="observacao"
              rows={2}
              defaultValue={epiGhe?.observacao ?? ""}
              placeholder="Ex.: Classe 3 para média tensão; substituir a cada 12 meses"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

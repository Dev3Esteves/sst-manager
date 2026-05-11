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
  NC_ORIGEM,
  NC_ORIGEM_LABEL,
  NC_SEVERIDADE,
  NC_SEVERIDADE_LABEL,
  NC_STATUS,
  NC_STATUS_LABEL,
  NC_METODO_ANALISE,
  NC_METODO_ANALISE_LABEL,
  type NcOrigem,
  type NcSeveridade,
  type NcStatus,
  type NcMetodoAnalise,
} from "@/lib/validations/nao-conformidade"

type Nc = {
  id?: string
  empresa_id?: string
  obra_id?: string | null
  ocorrencia_id?: string | null
  titulo?: string
  descricao?: string
  origem?: NcOrigem
  data_identificacao?: string
  identificado_por_nome?: string | null
  severidade?: NcSeveridade
  status?: NcStatus
  data_encerramento?: string | null
  metodo_analise?: NcMetodoAnalise | null
  causa_raiz_consolidada?: string | null
  observacoes?: string | null
}

type ActionResult = { error?: Record<string, string[]> | { _form?: string[] } } | { ok: boolean } | void

export function NcForm({
  nc,
  empresas,
  obras,
  action,
  onDelete,
  modo,
}: {
  nc?: Nc
  empresas: { id: string; razao_social: string }[]
  obras: { id: string; nome: string; empresa_id: string }[]
  action: (formData: FormData) => Promise<ActionResult>
  onDelete?: () => Promise<ActionResult>
  modo: "criar" | "editar"
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [empresaId, setEmpresaId] = useState(nc?.empresa_id ?? empresas[0]?.id ?? "")

  const obrasFiltradas = obras.filter((o) => o.empresa_id === empresaId)

  function handleSubmit(formData: FormData) {
    setErrors({})
    startTransition(async () => {
      const result = await action(formData)
      if (result && "error" in result && result.error) {
        const err = result.error as Record<string, string[]>
        setErrors(err)
      }
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
      if (result && "error" in result && result.error) {
        setErrors(result.error as Record<string, string[]>)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {modo === "criar" ? "Nova não-conformidade" : "Editar não-conformidade"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ISO 45001 cl. 10.2 — registro, análise de causa raiz e ações corretivas.
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
            {pending ? "Salvando..." : modo === "criar" ? "Criar NC" : "Salvar"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="empresa_id">Empresa *</Label>
              <Select name="empresa_id" value={empresaId} onValueChange={setEmpresaId} required>
                <SelectTrigger id="empresa_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.empresa_id && (
                <p className="text-xs text-destructive mt-1">{errors.empresa_id[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="obra_id">Obra (opcional)</Label>
              <Select name="obra_id" defaultValue={nc?.obra_id ?? "none"}>
                <SelectTrigger id="obra_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem obra vinculada</SelectItem>
                  {obrasFiltradas.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              name="titulo"
              defaultValue={nc?.titulo ?? ""}
              placeholder="Ex.: Vazamento de gás em compressor da galpão 2"
              required
            />
            {errors.titulo && (
              <p className="text-xs text-destructive mt-1">{errors.titulo[0]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <textarea
              id="descricao"
              name="descricao"
              rows={3}
              defaultValue={nc?.descricao ?? ""}
              placeholder="Descreva a NC: o que aconteceu, quando, onde, impacto observado"
              required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.descricao && (
              <p className="text-xs text-destructive mt-1">{errors.descricao[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="origem">Origem *</Label>
              <Select name="origem" defaultValue={nc?.origem ?? "auditoria_interna"} required>
                <SelectTrigger id="origem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NC_ORIGEM.map((o) => (
                    <SelectItem key={o} value={o}>{NC_ORIGEM_LABEL[o]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severidade">Severidade *</Label>
              <Select name="severidade" defaultValue={nc?.severidade ?? "media"} required>
                <SelectTrigger id="severidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NC_SEVERIDADE.map((s) => (
                    <SelectItem key={s} value={s}>{NC_SEVERIDADE_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={nc?.status ?? "aberta"}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NC_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>{NC_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="data_identificacao">Data de identificação *</Label>
              <Input
                id="data_identificacao"
                name="data_identificacao"
                type="date"
                defaultValue={
                  nc?.data_identificacao?.slice(0, 10) ??
                  new Date().toISOString().slice(0, 10)
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="identificado_por_nome">Identificado por (nome)</Label>
              <Input
                id="identificado_por_nome"
                name="identificado_por_nome"
                defaultValue={nc?.identificado_por_nome ?? ""}
                placeholder="Ex.: Fernanda Cavalcante"
              />
            </div>
            <div>
              <Label htmlFor="metodo_analise">Método de análise</Label>
              <Select name="metodo_analise" defaultValue={nc?.metodo_analise ?? "ambos"}>
                <SelectTrigger id="metodo_analise">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NC_METODO_ANALISE.map((m) => (
                    <SelectItem key={m} value={m}>{NC_METODO_ANALISE_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Encerramento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="causa_raiz_consolidada">Causa raiz consolidada</Label>
            <textarea
              id="causa_raiz_consolidada"
              name="causa_raiz_consolidada"
              rows={2}
              defaultValue={nc?.causa_raiz_consolidada ?? ""}
              placeholder="Resumo final da análise de causa raiz (preenchido após 5 Whys / Ishikawa)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="data_encerramento">Data de encerramento</Label>
              <Input
                id="data_encerramento"
                name="data_encerramento"
                type="date"
                defaultValue={nc?.data_encerramento ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                name="observacoes"
                defaultValue={nc?.observacoes ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

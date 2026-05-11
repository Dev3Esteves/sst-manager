"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import {
  AC_STATUS,
  AC_STATUS_LABEL,
  AC_TIPO,
  AC_TIPO_LABEL,
  type AcStatus,
  type AcTipo,
} from "@/lib/validations/nao-conformidade"

export type AcRow = {
  id: string
  numero_sequencial: number
  tipo: AcTipo
  descricao: string
  responsavel_nome: string | null
  data_prazo: string
  data_inicio: string | null
  data_conclusao: string | null
  status: AcStatus
  evidencia_eficacia: string | null
  verificado_em: string | null
  verificado_por_nome: string | null
  eficaz: boolean | null
}

type ActionResult = { error?: { _form?: string[] } | Record<string, string[]> } | { ok: boolean } | void

const STATUS_BADGE: Record<AcStatus, "default" | "outline" | "secondary" | "alerta"> = {
  planejada: "outline",
  em_andamento: "alerta",
  concluida: "default",
  cancelada: "secondary",
}

export function AcoesEditor({
  ncId,
  acoes,
  proximoNumero,
  createAction,
  updateAction,
  deleteAction,
}: {
  ncId: string
  acoes: AcRow[]
  proximoNumero: number
  createAction: (ncId: string, formData: FormData) => Promise<ActionResult>
  updateAction: (acId: string, ncId: string, formData: FormData) => Promise<ActionResult>
  deleteAction: (acId: string, ncId: string) => Promise<ActionResult>
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Tipos: <strong>Contenção</strong> (imediata) ·{" "}
          <strong>Corretiva</strong> (elimina causa raiz, ISO 45001 10.2c) ·{" "}
          <strong>Preventiva</strong> (antes do fato). Verificação de eficácia
          é mandatória para fechamento.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus className="h-4 w-4" />
          {showCreate ? "Cancelar" : "Nova ação"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-6">
            <AcForm
              initialNumero={proximoNumero}
              action={async (fd) => {
                const r = await createAction(ncId, fd)
                if (!(r && "error" in r && r.error)) {
                  setShowCreate(false)
                }
                return r
              }}
              labelSubmit="Criar ação"
            />
          </CardContent>
        </Card>
      )}

      {acoes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhuma ação corretiva. Clique em <strong>Nova ação</strong> para iniciar.
        </p>
      ) : (
        <div className="space-y-2">
          {acoes.map((ac) => {
            const isOpen = expanded === ac.id
            return (
              <Card key={ac.id}>
                <CardContent className="pt-4 pb-4">
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : ac.id)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <Badge variant="outline" className="font-mono text-[10px] mt-0.5">
                        AC-{String(ac.numero_sequencial).padStart(2, "0")}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{ac.descricao}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                          <span>{AC_TIPO_LABEL[ac.tipo]}</span>
                          <span>·</span>
                          <span>
                            Prazo: {new Date(ac.data_prazo).toLocaleDateString("pt-BR")}
                          </span>
                          {ac.responsavel_nome && (
                            <>
                              <span>·</span>
                              <span>{ac.responsavel_nome}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={STATUS_BADGE[ac.status]} className="text-[10px]">
                        {AC_STATUS_LABEL[ac.status]}
                      </Badge>
                      {ac.eficaz === true && (
                        <Badge variant="default" className="text-[10px]">
                          ✓ Eficaz
                        </Badge>
                      )}
                      {ac.eficaz === false && (
                        <Badge variant="critico" className="text-[10px]">
                          ✗ Ineficaz
                        </Badge>
                      )}
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t">
                      <AcForm
                        initial={ac}
                        action={async (fd) => updateAction(ac.id, ncId, fd)}
                        onDelete={async () => {
                          const r = await deleteAction(ac.id, ncId)
                          if (!(r && "error" in r && r.error)) {
                            setExpanded(null)
                          }
                          return r
                        }}
                        labelSubmit="Salvar"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AcForm({
  initial,
  initialNumero,
  action,
  onDelete,
  labelSubmit,
}: {
  initial?: AcRow
  initialNumero?: number
  action: (formData: FormData) => Promise<ActionResult>
  onDelete?: () => Promise<ActionResult>
  labelSubmit: string
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSubmit(formData: FormData) {
    setErrMsg(null)
    startTransition(async () => {
      const r = await action(formData)
      if (r && "error" in r && r.error) {
        const e = r.error
        if ("_form" in e && e._form) {
          setErrMsg(e._form[0])
        } else {
          const first = Object.values(e as Record<string, string[]>)[0]?.[0]
          setErrMsg(first ?? "Erro de validação")
        }
        setSaved(false)
      } else {
        setSaved(true)
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
      await onDelete()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <input type="hidden" name="numero_sequencial" value={initial?.numero_sequencial ?? initialNumero ?? 1} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Tipo *</Label>
          <Select name="tipo" defaultValue={initial?.tipo ?? "corretiva"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AC_TIPO.map((t) => (
                <SelectItem key={t} value={t}>{AC_TIPO_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select name="status" defaultValue={initial?.status ?? "planejada"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AC_STATUS.map((s) => (
                <SelectItem key={s} value={s}>{AC_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Prazo *</Label>
          <Input type="date" name="data_prazo" defaultValue={initial?.data_prazo?.slice(0, 10) ?? ""} required />
        </div>
      </div>

      <div>
        <Label className="text-xs">Descrição *</Label>
        <textarea
          name="descricao"
          rows={2}
          defaultValue={initial?.descricao ?? ""}
          placeholder="O que será feito para eliminar a causa raiz?"
          required
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Responsável</Label>
          <Input
            name="responsavel_nome"
            defaultValue={initial?.responsavel_nome ?? ""}
            placeholder="Nome do responsável"
          />
        </div>
        <div>
          <Label className="text-xs">Data de início</Label>
          <Input
            type="date"
            name="data_inicio"
            defaultValue={initial?.data_inicio?.slice(0, 10) ?? ""}
          />
        </div>
        <div>
          <Label className="text-xs">Data de conclusão</Label>
          <Input
            type="date"
            name="data_conclusao"
            defaultValue={initial?.data_conclusao?.slice(0, 10) ?? ""}
          />
        </div>
      </div>

      <div className="rounded-md border-2 border-dashed p-3 space-y-2">
        <Label className="text-xs font-semibold">Verificação de eficácia (ISO 45001 10.2 d/e)</Label>
        <textarea
          name="evidencia_eficacia"
          rows={2}
          defaultValue={initial?.evidencia_eficacia ?? ""}
          placeholder="Ex.: 30 dias sem recorrência; auditoria interna confirmou; SLA atingido"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Verificado em</Label>
            <Input
              type="date"
              name="verificado_em"
              defaultValue={initial?.verificado_em?.slice(0, 10) ?? ""}
            />
          </div>
          <div>
            <Label className="text-xs">Verificado por</Label>
            <Input
              name="verificado_por_nome"
              defaultValue={initial?.verificado_por_nome ?? ""}
            />
          </div>
          <div>
            <Label className="text-xs">Resultado</Label>
            <Select
              name="eficaz"
              defaultValue={
                initial?.eficaz === true ? "sim" : initial?.eficaz === false ? "nao" : "none"
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Não verificado</SelectItem>
                <SelectItem value="sim">Eficaz</SelectItem>
                <SelectItem value="nao">Ineficaz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {errMsg && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-2 text-xs text-destructive">
          {errMsg}
        </div>
      )}

      {saved && !errMsg && (
        <div className="flex items-center gap-2 text-xs text-status-regular">
          <CheckCircle2 className="h-3 w-3" />
          Salvo.
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onDelete && (
          <Button
            type="button"
            variant={confirmDelete ? "destructive" : "outline"}
            size="sm"
            onClick={handleDelete}
            disabled={pending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmDelete ? "Confirmar exclusão" : "Excluir"}
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {labelSubmit}
        </Button>
      </div>
    </form>
  )
}

"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, Unlock, Plus, Trash2, ShieldCheck } from "lucide-react"
import { salvarTravaConfig, adicionarIsencao, removerIsencao } from "./actions"

type Config = { trava_ativa: boolean; carencia_dias: number; data_ativacao: string | null }
type Usuario = { id: string; email: string }
type Modulo = { slug: string; titulo: string }
type Isencao = { id: string; usuario_id: string; modulo_slug: string; motivo: string | null; email: string }

export function TravaConfig({
  config, usuarios, modulos, isencoes,
}: {
  config: Config
  usuarios: Usuario[]
  modulos: Modulo[]
  isencoes: Isencao[]
}) {
  const [pending, startTransition] = useTransition()
  const [ativa, setAtiva] = useState(config.trava_ativa ? "1" : "0")
  const [carencia, setCarencia] = useState(String(config.carencia_dias))

  function salvar() {
    startTransition(async () => {
      const r = await salvarTravaConfig({ trava_ativa: ativa === "1", carencia_dias: Number(carencia) })
      if ("error" in r) toast.error(r.error)
      else toast.success("Configuração salva.")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {config.trava_ativa ? <Lock className="h-4 w-4 text-status-alerta" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
          Trava de treinamento
          <Badge variant={config.trava_ativa ? "alerta" : "secondary"}>{config.trava_ativa ? "Ativa" : "Inativa"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Com a trava ativa, cada usuário (exceto administradores) só usa um módulo após concluir o treinamento dele.
          Durante a <strong>carência</strong>, ninguém é bloqueado — é o tempo para todos se treinarem.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={ativa} onValueChange={setAtiva}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Inativa (sem bloqueio)</SelectItem>
                <SelectItem value="1">Ativa (bloqueia)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Carência (dias)</Label>
            <Input type="number" min={0} value={carencia} onChange={(e) => setCarencia(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ativada em</Label>
            <div className="h-9 flex items-center text-sm text-muted-foreground">
              {config.data_ativacao ? new Date(config.data_ativacao).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
        </div>
        <Button onClick={salvar} disabled={pending} size="sm">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Salvar configuração
        </Button>

        <div className="border-t pt-4 space-y-3">
          <div className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Isenções</div>
          <p className="text-xs text-muted-foreground">Usuários isentos não são bloqueados (use para quem já domina o módulo).</p>
          <IsencaoForm usuarios={usuarios} modulos={modulos} pending={pending} startTransition={startTransition} />
          <div className="divide-y rounded-md border">
            {isencoes.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2 p-2.5 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{i.email}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {i.modulo_slug === "*" ? "Todos os módulos" : (modulos.find((m) => m.slug === i.modulo_slug)?.titulo ?? i.modulo_slug)}
                  </Badge>
                  {i.motivo && <span className="text-xs text-muted-foreground ml-2">· {i.motivo}</span>}
                </div>
                <Button variant="ghost" size="icon" disabled={pending}
                  onClick={() => startTransition(async () => { const r = await removerIsencao(i.id); if ("error" in r) toast.error(r.error) })}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {isencoes.length === 0 && <div className="p-3 text-center text-xs text-muted-foreground">Nenhuma isenção.</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IsencaoForm({
  usuarios, modulos, pending, startTransition,
}: {
  usuarios: Usuario[]
  modulos: Modulo[]
  pending: boolean
  startTransition: (cb: () => void) => void
}) {
  const [usuarioId, setUsuarioId] = useState("")
  const [moduloSlug, setModuloSlug] = useState("*")
  const [motivo, setMotivo] = useState("")

  function add() {
    if (!usuarioId) { toast.error("Selecione um usuário."); return }
    startTransition(async () => {
      const r = await adicionarIsencao({ usuario_id: usuarioId, modulo_slug: moduloSlug, motivo })
      if ("error" in r) toast.error(r.error)
      else { toast.success("Isenção adicionada."); setMotivo("") }
    })
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <div className="space-y-1.5">
        <Label className="text-xs">Usuário</Label>
        <Select value={usuarioId} onValueChange={setUsuarioId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Módulo</Label>
        <Select value={moduloSlug} onValueChange={setModuloSlug}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="*">Todos os módulos</SelectItem>
            {modulos.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.titulo}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Motivo (opcional)</Label>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: já treinado" />
      </div>
      <Button onClick={add} disabled={pending} size="sm">
        <Plus className="h-4 w-4" /> Isentar
      </Button>
    </div>
  )
}

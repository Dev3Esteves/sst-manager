"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, ArrowLeft, KeyRound, Power, PowerOff, Trash2, Copy } from "lucide-react"
import { editarUsuario, resetarSenha, toggleAtivo, excluirUsuario } from "../actions"

type Perfil = { id: string; nome: string; descricao: string | null }
type Empresa = { id: string; razao_social: string }
type Colaborador = { id: string; nome_completo: string; email: string | null }

export function EditarUsuarioForm({
  usuarioId, authEmail, lastSignIn, isSelf, initial, perfis, empresas, colaboradores,
}: {
  usuarioId: string
  authEmail: string
  lastSignIn: string | null
  isSelf: boolean
  initial: { perfil_id: string; empresa_id: string; colaborador_id: string | null; ativo: boolean }
  perfis: Perfil[]
  empresas: Empresa[]
  colaboradores: Colaborador[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [perfilId, setPerfilId] = useState(initial.perfil_id)
  const [empresaId, setEmpresaId] = useState(initial.empresa_id)
  const [colaboradorId, setColaboradorId] = useState(initial.colaborador_id ?? "")
  const [ativo, setAtivo] = useState(initial.ativo)
  const [novaSenha, setNovaSenha] = useState<string | null>(null)

  function handleSalvar() {
    startTransition(async () => {
      const r = await editarUsuario(usuarioId, {
        perfil_id: perfilId,
        empresa_id: empresaId,
        colaborador_id: colaboradorId || null,
        ativo,
      })
      if (!r.ok) {
        toast.error("Falha ao salvar", { description: r.error })
        return
      }
      toast.success("Alterações salvas")
      router.refresh()
    })
  }

  function handleResetarSenha() {
    const aviso = isSelf
      ? "ATENÇÃO: Você está resetando a SUA PRÓPRIA senha. Sua sessão atual será encerrada e você precisará logar novamente com a nova senha. Anote-a antes de fechar a tela. Continuar?"
      : "Gerar nova senha para este usuário? A senha atual será invalidada."
    if (!confirm(aviso)) return
    startTransition(async () => {
      const r = await resetarSenha(usuarioId)
      if (!r.ok) {
        toast.error("Falha ao resetar senha", { description: r.error })
        return
      }
      setNovaSenha(r.data.senha)
      toast.success("Nova senha gerada — anote antes de sair desta tela.", { duration: 30000 })
    })
  }

  function handleToggleAtivo() {
    const novoValor = !ativo
    startTransition(async () => {
      const r = await toggleAtivo(usuarioId, novoValor)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      setAtivo(novoValor)
      toast.success(novoValor ? "Usuário ativado" : "Usuário desativado")
    })
  }

  function handleExcluir() {
    if (!confirm("EXCLUIR este usuário permanentemente? Esta ação não pode ser desfeita.")) return
    if (!confirm("Tem certeza? Os registros criados por ele permanecerão no audit_log.")) return
    startTransition(async () => {
      const r = await excluirUsuario(usuarioId)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success("Usuário excluído")
      router.push("/usuarios")
    })
  }

  async function copiarSenha() {
    if (!novaSenha) return
    try {
      await navigator.clipboard.writeText(novaSenha)
      toast.success("Senha copiada")
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar usuário</h1>
          <p className="text-muted-foreground">{authEmail}</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/usuarios"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
      </div>

      {novaSenha && (
        <Card className="border-status-regular border-2 sticky top-20 z-10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Nova senha gerada</CardTitle>
            <CardDescription>
              {isSelf
                ? "⚠️ Sua sessão será encerrada. Copie a senha, depois clique em 'Ir para login' — você precisará dela."
                : "Anote agora — não poderá ser recuperada depois."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-base font-mono font-bold select-all">{novaSenha}</code>
              <Button variant="outline" size="icon" onClick={copiarSenha} title="Copiar">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {isSelf && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await copiarSenha()
                    toast.success("Senha copiada. Redirecionando para login...")
                    setTimeout(() => { window.location.href = "/login" }, 1500)
                  }}
                >
                  Copiar e ir para login
                </Button>
                <Button variant="ghost" onClick={() => setNovaSenha(null)}>
                  Já anotei, fechar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Metadados</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
          <Row label="E-mail" value={authEmail} />
          <Row label="ID" value={<code className="text-[11px]">{usuarioId}</code>} />
          <Row label="Último acesso" value={lastSignIn ? new Date(lastSignIn).toLocaleString("pt-BR") : "Nunca"} />
          <Row label="Status" value={ativo ? <Badge variant="regular">Ativo</Badge> : <Badge variant="vencido">Inativo</Badge>} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Vínculo e permissões</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Perfil *</Label>
            <Select value={perfilId} onValueChange={setPerfilId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {perfis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Colaborador vinculado</Label>
            <Select value={colaboradorId || "__none__"} onValueChange={(v) => setColaboradorId(v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">(sem vínculo)</SelectItem>
                {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-status-alerta">
        <CardHeader>
          <CardTitle className="text-base">Ações administrativas</CardTitle>
          <CardDescription>Operações sensíveis — confirme antes.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleResetarSenha} disabled={pending}>
            <KeyRound className="h-4 w-4" />
            Resetar senha
          </Button>
          <Button variant="outline" onClick={handleToggleAtivo} disabled={pending || (isSelf && ativo)}>
            {ativo
              ? <><PowerOff className="h-4 w-4" />Desativar</>
              : <><Power className="h-4 w-4" />Ativar</>}
          </Button>
          <Button variant="destructive" onClick={handleExcluir} disabled={pending || isSelf}>
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
          {isSelf && (
            <p className="text-xs text-muted-foreground w-full">
              Você não pode desativar nem excluir a própria conta.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t -mx-6 px-6">
        <Button variant="outline" asChild>
          <Link href="/usuarios">Cancelar</Link>
        </Button>
        <Button onClick={handleSalvar} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

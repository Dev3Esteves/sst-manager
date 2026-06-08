"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Sparkles, Copy, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { criarUsuario } from "../actions"
import { gerarSenhaForte } from "@/lib/validations/usuario"
import { brand } from "@/config/brand"

type Perfil = { id: string; nome: string; descricao: string | null }
type Empresa = { id: string; razao_social: string }
type Colaborador = { id: string; nome_completo: string; email: string | null }

export function NovoUsuarioForm({
  perfis, empresas, colaboradores,
}: {
  perfis: Perfil[]
  empresas: Empresa[]
  colaboradores: Colaborador[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState(gerarSenhaForte())
  const [mostrarSenha, setMostrarSenha] = useState(true)
  const [perfilId, setPerfilId] = useState("")
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "")
  // Empresas adicionais (além da principal) que o usuário poderá operar/alternar.
  const [empresasExtras, setEmpresasExtras] = useState<string[]>([])
  const [colaboradorId, setColaboradorId] = useState("")

  function toggleEmpresaExtra(id: string) {
    setEmpresasExtras((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    )
  }

  const [criadoOk, setCriadoOk] = useState<{ email: string; senha: string } | null>(null)

  function preencherDoColaborador(id: string) {
    setColaboradorId(id)
    if (id && !email) {
      const c = colaboradores.find((x) => x.id === id)
      if (c?.email) setEmail(c.email)
    }
  }

  function regenerarSenha() {
    setSenha(gerarSenhaForte())
    toast.info("Nova senha gerada")
  }

  async function copiar(texto: string, label: string) {
    try {
      await navigator.clipboard.writeText(texto)
      toast.success(`${label} copiado`)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  function handleSubmit() {
    if (!email || !senha || !perfilId || !empresaId) {
      toast.warning("Preencha e-mail, senha, perfil e empresa.")
      return
    }
    startTransition(async () => {
      const result = await criarUsuario({
        email,
        senha,
        perfil_id: perfilId,
        empresa_id: empresaId,
        empresas_ids: empresasExtras,
        colaborador_id: colaboradorId || null,
        ativo: true,
      })
      if (!result.ok) {
        toast.error("Falha ao criar usuário", { description: result.error })
        return
      }
      setCriadoOk({ email, senha })
      toast.success("Usuário criado. Entregue a senha abaixo ao colaborador.")
    })
  }

  if (criadoOk) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuário criado</h1>
          <p className="text-muted-foreground">
            Anote as credenciais agora — a senha <strong>não poderá ser recuperada</strong> depois.
          </p>
        </div>

        <Card className="border-status-regular">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-status-regular" />
              Credenciais do novo usuário
            </CardTitle>
            <CardDescription>
              Copie e envie pelo canal seguro combinado com o colaborador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-20">E-mail</Label>
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">{criadoOk.email}</code>
              <Button variant="outline" size="icon" onClick={() => copiar(criadoOk.email, "E-mail")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20">Senha</Label>
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">{criadoOk.senha}</code>
              <Button variant="outline" size="icon" onClick={() => copiar(criadoOk.senha, "Senha")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => {
            setCriadoOk(null); setEmail(""); setSenha(gerarSenhaForte())
            setColaboradorId(""); setPerfilId("")
          }}>
            Criar outro
          </Button>
          <Button onClick={() => router.push("/usuarios")}>
            Voltar para lista
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo usuário</h1>
          <p className="text-muted-foreground">Cria o login + vincula perfil, empresa e (opcional) colaborador.</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/usuarios"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados de acesso</CardTitle>
          <CardDescription>O e-mail será o login. A senha é gerada automaticamente — troque se preferir.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`colaborador@${brand.emailDomain}`}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="senha">Senha temporária *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Mostrar/esconder senha"
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" onClick={regenerarSenha}>
                <Sparkles className="h-4 w-4" />
                Gerar nova
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres. Recomendado: entregar ao colaborador e orientar a troca no primeiro acesso (futuramente adicionaremos fluxo de recuperação de senha).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vínculo e permissões</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Perfil de acesso *</Label>
            <Select value={perfilId} onValueChange={setPerfilId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {perfis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}{p.descricao ? ` — ${p.descricao.split(" — ")[0]}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Empresa principal *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Empresa-empregadora e empresa ativa inicial.</p>
          </div>
          {empresas.length > 1 && (
            <div className="space-y-2 md:col-span-2">
              <Label>Outras empresas que pode operar (grupo)</Label>
              <div className="grid gap-2 sm:grid-cols-2 rounded-md border p-3">
                {empresas.filter((e) => e.id !== empresaId).map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={empresasExtras.includes(e.id)}
                      onChange={() => toggleEmpresaExtra(e.id)}
                    />
                    {e.razao_social}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Marque para permitir que este usuário alterne entre empresas pelo seletor no topo.
              </p>
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>Colaborador vinculado (opcional)</Label>
            <Select value={colaboradorId || "__none__"} onValueChange={(v) => preencherDoColaborador(v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">(sem vínculo)</SelectItem>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome_completo}{c.email ? ` — ${c.email}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Marque se o usuário também é um empregado cadastrado — isso liga as ações (ex: inspetor em inspeções) ao perfil dele.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" asChild>
          <Link href="/usuarios">Cancelar</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar usuário
        </Button>
      </div>
    </div>
  )
}

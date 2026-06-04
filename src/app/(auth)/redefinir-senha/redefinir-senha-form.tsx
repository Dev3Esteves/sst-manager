"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import { trocarSenhaSchema } from "@/lib/validations/configuracoes"

export function RedefinirSenhaForm() {
  const router = useRouter()
  const [temSessao, setTemSessao] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setTemSessao(!!data.session))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const parsed = trocarSenhaSchema.safeParse({
      senha: form.get("senha"),
      confirmacao: form.get("confirmacao"),
    })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Dados inválidos")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: parsed.data.senha })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setOk(true)
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 1200)
  }

  if (temSessao === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Link inválido ou expirado</CardTitle>
          <CardDescription>
            O link de recuperação não é mais válido. Solicite um novo para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/esqueci-senha">Solicitar novo link</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Definir nova senha</CardTitle>
        <CardDescription>Escolha uma nova senha de acesso para a sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
            <Input id="senha" name="senha" type="password" required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacao">Confirmar nova senha</Label>
            <Input id="confirmacao" name="confirmacao" type="password" required autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          {ok && <p className="text-sm text-status-regular">Senha alterada! Redirecionando...</p>}
          <Button type="submit" className="w-full" disabled={loading || ok || temSessao === null}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar nova senha
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login"><ArrowLeft className="h-4 w-4" /> Voltar para o login</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

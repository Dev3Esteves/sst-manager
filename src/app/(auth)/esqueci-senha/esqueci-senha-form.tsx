"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MailCheck, ArrowLeft } from "lucide-react"

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    // Não revelamos se o e-mail existe (evita enumeração de contas)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MailCheck className="h-5 w-5 text-status-regular" /> Verifique seu e-mail
          </CardTitle>
          <CardDescription>
            Se houver uma conta com <strong>{email}</strong>, enviamos um link para redefinir
            a senha. O link expira em 1 hora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login"><ArrowLeft className="h-4 w-4" /> Voltar para o login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu e-mail e enviaremos um link para definir uma nova senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@sistenge.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar link de recuperação
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login"><ArrowLeft className="h-4 w-4" /> Voltar para o login</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

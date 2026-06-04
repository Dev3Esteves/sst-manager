"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, KeyRound } from "lucide-react"
import { trocarSenha } from "./actions"

type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function TrocarSenhaForm() {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setErrors({})
    startTransition(async () => {
      const result = await trocarSenha(formData)
      if ("error" in result) {
        setErrors(result.error)
        if (result.error._form?.[0]) toast.error(result.error._form[0])
      } else {
        toast.success("Senha alterada com sucesso.")
        // Limpa os campos resetando o form
        document.querySelectorAll<HTMLInputElement>("#trocar-senha-form input").forEach((i) => (i.value = ""))
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5" /> Trocar senha
        </CardTitle>
        <CardDescription>Defina uma nova senha de acesso para a sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="trocar-senha-form" action={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha *</Label>
            <Input id="senha" name="senha" type="password" autoComplete="new-password" required />
            <FieldError error={errors.senha} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacao">Confirmar nova senha *</Label>
            <Input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" required />
            <FieldError error={errors.confirmacao} />
          </div>
          {errors._form?.[0] && (
            <p className="text-sm text-destructive" role="alert">{errors._form[0]}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar nova senha
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function FieldError({ error }: { error?: string[] }) {
  if (!error?.length) return null
  return <p className="text-xs text-destructive">{error[0]}</p>
}

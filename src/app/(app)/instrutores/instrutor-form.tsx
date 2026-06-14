"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, GraduationCap } from "lucide-react"
import { INSTRUTOR_REGISTRO_LABEL, type InstrutorInput } from "@/lib/validations/instrutor"

type FormErrors = { _form?: string[] }
type InstrutorExistente = {
  id: string; nome: string; registro_tipo: string | null; registro_numero: string | null
  formacao: string | null; telefone: string | null; email: string | null; observacoes: string | null; ativo: boolean
}

const NENHUM = "__nenhum__"

export function InstrutorForm({
  instrutor, action,
}: {
  instrutor?: InstrutorExistente
  action: (payload: InstrutorInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [nome, setNome] = useState(instrutor?.nome ?? "")
  const [registroTipo, setRegistroTipo] = useState(instrutor?.registro_tipo ?? NENHUM)
  const [registroNumero, setRegistroNumero] = useState(instrutor?.registro_numero ?? "")
  const [formacao, setFormacao] = useState(instrutor?.formacao ?? "")
  const [telefone, setTelefone] = useState(instrutor?.telefone ?? "")
  const [email, setEmail] = useState(instrutor?.email ?? "")
  const [observacoes, setObservacoes] = useState(instrutor?.observacoes ?? "")
  const [ativo, setAtivo] = useState(instrutor?.ativo ?? true)

  function handleSubmit() {
    const payload: InstrutorInput = {
      nome,
      registro_tipo: registroTipo === NENHUM ? null : (registroTipo as InstrutorInput["registro_tipo"]),
      registro_numero: registroNumero || null,
      formacao: formacao || null,
      telefone: telefone || null,
      email: email || null,
      observacoes: observacoes || null,
      ativo,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{instrutor ? "Editar instrutor" : "Cadastrar instrutor"}</h1>
          <p className="text-muted-foreground">Profissional que ministra treinamentos.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados do instrutor</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registro_tipo">Tipo de registro</Label>
            <Select value={registroTipo} onValueChange={setRegistroTipo}>
              <SelectTrigger id="registro_tipo"><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>Nenhum</SelectItem>
                {Object.entries(INSTRUTOR_REGISTRO_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg">Número do registro</Label>
            <Input id="reg" value={registroNumero} onChange={(e) => setRegistroNumero(e.target.value)} placeholder="Ex: 123456/SP" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="form">Formação / capacitação</Label>
            <Input id="form" value={formacao} onChange={(e) => setFormacao(e.target.value)} placeholder="Ex: Eng. de Segurança do Trabalho" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel">Telefone</Label>
            <Input id="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mail">E-mail</Label>
            <Input id="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <textarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4" />
            Instrutor ativo
          </label>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/instrutores">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !nome.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {instrutor ? "Salvar alterações" : "Cadastrar instrutor"}
        </Button>
      </div>
    </div>
  )
}

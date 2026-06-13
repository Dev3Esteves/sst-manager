"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type Colaborador = {
  id?: string
  empresa_id: string
  nome_completo: string
  cpf: string
  rg?: string | null
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  email?: string | null
  cargo_id?: string | null
  obra_id?: string | null
  data_admissao: string
  tipo_vinculo: string
  matricula?: string | null
  status: string
}

type Empresa = { id: string; razao_social: string }
type Cargo = { id: string; titulo: string }
type Obra = { id: string; nome: string; empresa_id: string }
type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function ColaboradorForm({
  colaborador, empresas, cargos, obras = [], action,
}: {
  colaborador?: Colaborador
  empresas: Empresa[]
  cargos: Cargo[]
  obras?: Obra[]
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [empresaId, setEmpresaId] = useState(colaborador?.empresa_id || empresas[0]?.id || "")
  const [cargoId, setCargoId] = useState(colaborador?.cargo_id || "")
  const [obraId, setObraId] = useState(colaborador?.obra_id || "")
  const [sexo, setSexo] = useState(colaborador?.sexo || "")
  const [vinculo, setVinculo] = useState(colaborador?.tipo_vinculo || "clt")
  const [status, setStatus] = useState(colaborador?.status || "ativo")

  // Obras disponíveis para a empresa selecionada
  const obrasDaEmpresa = obras.filter((o) => o.empresa_id === empresaId)

  async function handleSubmit(formData: FormData) {
    formData.set("empresa_id", empresaId)
    if (cargoId) formData.set("cargo_id", cargoId)
    formData.set("obra_id", obraId || "")
    if (sexo) formData.set("sexo", sexo)
    formData.set("tipo_vinculo", vinculo)
    formData.set("status", status)
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) {
        setErrors(result.error)
        // Move o foco para o primeiro campo com erro (checklist: acessibilidade).
        const primeiro = Object.keys(result.error).find((k) => k !== "_form")
        if (primeiro) setTimeout(() => document.getElementById(primeiro)?.focus(), 0)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{colaborador ? "Editar colaborador" : "Novo colaborador"}</CardTitle>
          <CardDescription>Dados pessoais, vínculo e cargo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome_completo">Nome completo *</Label>
            <Input id="nome_completo" name="nome_completo" defaultValue={colaborador?.nome_completo} required
              aria-invalid={!!errors.nome_completo} aria-describedby={errors.nome_completo ? "nome_completo-error" : undefined} />
            <FieldError error={errors.nome_completo} id="nome_completo-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input id="cpf" name="cpf" defaultValue={colaborador?.cpf} placeholder="000.000.000-00" required inputMode="numeric"
              aria-invalid={!!errors.cpf} aria-describedby={errors.cpf ? "cpf-error" : undefined} />
            <FieldError error={errors.cpf} id="cpf-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rg">RG</Label>
            <Input id="rg" name="rg" defaultValue={colaborador?.rg ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de nascimento</Label>
            <Input id="data_nascimento" name="data_nascimento" type="date" defaultValue={colaborador?.data_nascimento ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo</Label>
            <Select value={sexo} onValueChange={setSexo}>
              <SelectTrigger id="sexo"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" name="telefone" type="tel" inputMode="tel" defaultValue={colaborador?.telefone ?? ""} placeholder="(11) 91234-5678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={colaborador?.email ?? ""}
              aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
            <FieldError error={errors.email} id="email-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa_id">Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger id="empresa_id" aria-invalid={!!errors.empresa_id}
                aria-describedby={errors.empresa_id ? "empresa_id-error" : undefined}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError error={errors.empresa_id} id="empresa_id-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cargo_id">Cargo</Label>
            <Select value={cargoId} onValueChange={setCargoId}>
              <SelectTrigger id="cargo_id"><SelectValue placeholder="Sem cargo" /></SelectTrigger>
              <SelectContent>
                {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="obra_id">Obra atual</Label>
            <Select
              value={obraId || "none"}
              onValueChange={(v) => setObraId(v === "none" ? "" : v)}
            >
              <SelectTrigger id="obra_id"><SelectValue placeholder="Sem obra" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— sem obra —</SelectItem>
                {obrasDaEmpresa.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {obrasDaEmpresa.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma obra ativa para esta empresa. <Link href="/obras/new" className="underline">Cadastrar obra</Link>.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_admissao">Data de admissão *</Label>
            <Input id="data_admissao" name="data_admissao" type="date" defaultValue={colaborador?.data_admissao} required
              aria-invalid={!!errors.data_admissao} aria-describedby={errors.data_admissao ? "data_admissao-error" : undefined} />
            <FieldError error={errors.data_admissao} id="data_admissao-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo_vinculo">Vínculo *</Label>
            <Select value={vinculo} onValueChange={setVinculo}>
              <SelectTrigger id="tipo_vinculo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clt">CLT</SelectItem>
                <SelectItem value="pj">PJ</SelectItem>
                <SelectItem value="temporario">Temporário</SelectItem>
                <SelectItem value="estagiario">Estagiário</SelectItem>
                <SelectItem value="terceiro">Terceiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input id="matricula" name="matricula" defaultValue={colaborador?.matricula ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="afastado">Afastado</SelectItem>
                <SelectItem value="ferias">Férias</SelectItem>
                <SelectItem value="demitido">Demitido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors._form && (
            <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/colaboradores">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {colaborador ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

function FieldError({ error, id }: { error?: string[]; id?: string }) {
  if (!error?.length) return null
  return <p id={id} role="alert" className="text-xs text-destructive">{error[0]}</p>
}

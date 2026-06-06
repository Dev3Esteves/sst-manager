"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, Stethoscope } from "lucide-react"
import { MEDICO_STATUS_LABEL, type MedicoInput } from "@/lib/validations/medico"

type FormErrors = { _form?: string[] }

type MedicoExistente = {
  id: string
  nome: string
  crm: string
  uf_crm: string | null
  especialidade: string | null
  status: string
  telefone: string | null
  email: string | null
  observacoes: string | null
}

export function MedicoForm({
  medico,
  action,
}: {
  medico?: MedicoExistente
  action: (payload: MedicoInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [buscando, setBuscando] = useState(false)
  const [nome, setNome] = useState(medico?.nome ?? "")
  const [crm, setCrm] = useState(medico?.crm ?? "")
  const [ufCrm, setUfCrm] = useState(medico?.uf_crm ?? "")
  const [especialidade, setEspecialidade] = useState(medico?.especialidade ?? "")
  const [status, setStatus] = useState(medico?.status ?? "ativo")
  const [telefone, setTelefone] = useState(medico?.telefone ?? "")
  const [email, setEmail] = useState(medico?.email ?? "")
  const [observacoes, setObservacoes] = useState(medico?.observacoes ?? "")

  async function buscarCrm() {
    const limpo = crm.replace(/\D/g, "")
    if (limpo.length < 3) {
      toast.warning("Informe o número do CRM para buscar.")
      return
    }
    setBuscando(true)
    try {
      const r = await fetch(`/api/integracoes/consultacrm?crm=${limpo}&uf=${encodeURIComponent(ufCrm)}`)
      const j = await r.json()
      if (!r.ok || !j.ok) {
        toast.error(j.erro ?? "CRM não encontrado")
        return
      }
      const d = j.data as { nome: string; uf: string | null; especialidade: string | null; situacao: string | null }
      if (d.nome) setNome(d.nome)
      if (d.uf) setUfCrm(d.uf)
      if (d.especialidade) setEspecialidade(d.especialidade)
      toast.success(`Dados do CRM preenchidos${d.situacao ? ` (situação: ${d.situacao})` : ""}. Confira antes de salvar.`)
    } catch {
      toast.error("Falha ao consultar o CRM. Preencha manualmente.")
    } finally {
      setBuscando(false)
    }
  }

  function handleSubmit() {
    const payload: MedicoInput = {
      nome,
      crm,
      uf_crm: ufCrm || null,
      especialidade: especialidade || null,
      status: status as MedicoInput["status"],
      telefone: telefone || null,
      email: email || null,
      observacoes: observacoes || null,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{medico ? "Editar médico" : "Cadastrar médico"}</h1>
          <p className="text-muted-foreground">Médico responsável por ASOs. Busque pelo CRM para autopreencher.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Registro profissional</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-12">
          <div className="space-y-2 md:col-span-4">
            <Label htmlFor="crm">CRM *</Label>
            <Input id="crm" value={crm} onChange={(e) => setCrm(e.target.value)} placeholder="Somente números" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="uf">UF</Label>
            <Input id="uf" value={ufCrm} maxLength={2} onChange={(e) => setUfCrm(e.target.value.toUpperCase())} placeholder="SP" />
          </div>
          <div className="space-y-2 md:col-span-6 flex flex-col justify-end">
            <Button type="button" variant="outline" onClick={buscarCrm} disabled={buscando}>
              {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar dados do CRM
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados do médico</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Dr. Fulano de Tal" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="esp">Especialidade</Label>
            <Input id="esp" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} placeholder="Ex: Medicina do Trabalho" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MEDICO_STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <textarea
              id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/medicos">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !nome.trim() || !crm.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {medico ? "Salvar alterações" : "Cadastrar médico"}
        </Button>
      </div>
    </div>
  )
}

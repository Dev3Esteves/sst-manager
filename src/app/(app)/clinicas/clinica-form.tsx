"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, Building2 } from "lucide-react"
import type { ClinicaInput } from "@/lib/validations/clinica"

type FormErrors = { _form?: string[] }

type ClinicaExistente = {
  id: string
  nome: string
  nome_fantasia: string | null
  cnpj: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  municipio: string | null
  uf: string | null
  telefone: string | null
  email: string | null
  ativo: boolean
}

export function ClinicaForm({
  clinica,
  action,
}: {
  clinica?: ClinicaExistente
  action: (payload: ClinicaInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [nome, setNome] = useState(clinica?.nome ?? "")
  const [nomeFantasia, setNomeFantasia] = useState(clinica?.nome_fantasia ?? "")
  const [cnpj, setCnpj] = useState(clinica?.cnpj ?? "")
  const [cep, setCep] = useState(clinica?.cep ?? "")
  const [logradouro, setLogradouro] = useState(clinica?.logradouro ?? "")
  const [numero, setNumero] = useState(clinica?.numero ?? "")
  const [complemento, setComplemento] = useState(clinica?.complemento ?? "")
  const [bairro, setBairro] = useState(clinica?.bairro ?? "")
  const [municipio, setMunicipio] = useState(clinica?.municipio ?? "")
  const [uf, setUf] = useState(clinica?.uf ?? "")
  const [telefone, setTelefone] = useState(clinica?.telefone ?? "")
  const [email, setEmail] = useState(clinica?.email ?? "")
  const [ativo, setAtivo] = useState(clinica?.ativo ?? true)

  async function buscarCnpj() {
    const limpo = cnpj.replace(/\D/g, "")
    if (limpo.length !== 14) {
      toast.warning("Informe um CNPJ com 14 dígitos para buscar.")
      return
    }
    setBuscandoCnpj(true)
    try {
      const r = await fetch(`/api/integracoes/brasilapi/cnpj?cnpj=${limpo}`)
      const j = await r.json()
      if (!r.ok || !j.ok) {
        toast.error(j.erro ?? "CNPJ não encontrado")
        return
      }
      const d = j.data as Record<string, string | null>
      if (d.razao_social) setNome(d.razao_social)
      if (d.nome_fantasia) setNomeFantasia(d.nome_fantasia)
      if (d.cep) setCep(d.cep)
      if (d.logradouro) setLogradouro(d.logradouro)
      if (d.numero) setNumero(d.numero)
      if (d.complemento) setComplemento(d.complemento)
      if (d.bairro) setBairro(d.bairro)
      if (d.municipio) setMunicipio(d.municipio)
      if (d.uf) setUf(d.uf)
      toast.success("Dados da Receita preenchidos. Confira antes de salvar.")
    } catch {
      toast.error("Falha ao consultar a Receita. Preencha manualmente.")
    } finally {
      setBuscandoCnpj(false)
    }
  }

  async function buscarCep() {
    const limpo = cep.replace(/\D/g, "")
    if (limpo.length !== 8) {
      toast.warning("Informe um CEP com 8 dígitos para buscar.")
      return
    }
    setBuscandoCep(true)
    try {
      const r = await fetch(`/api/integracoes/brasilapi/cep?cep=${limpo}`)
      const j = await r.json()
      if (!r.ok || !j.ok) {
        toast.error(j.erro ?? "CEP não encontrado")
        return
      }
      const d = j.data as Record<string, string | null>
      if (d.street) setLogradouro(d.street)
      if (d.neighborhood) setBairro(d.neighborhood)
      if (d.city) setMunicipio(d.city)
      if (d.state) setUf(d.state)
      toast.success("Endereço do CEP preenchido.")
    } catch {
      toast.error("Falha ao consultar o CEP.")
    } finally {
      setBuscandoCep(false)
    }
  }

  function handleSubmit() {
    const payload: ClinicaInput = {
      nome, nome_fantasia: nomeFantasia || null, cnpj: cnpj || null, cep: cep || null,
      logradouro: logradouro || null, numero: numero || null, complemento: complemento || null,
      bairro: bairro || null, municipio: municipio || null, uf: uf || null,
      telefone: telefone || null, email: email || null, ativo,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{clinica ? "Editar clínica" : "Cadastrar clínica"}</h1>
          <p className="text-muted-foreground">Clínica/laboratório de medicina ocupacional. Busque pelo CNPJ para autopreencher.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-12">
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2 md:col-span-3 flex flex-col justify-end">
            <Button type="button" variant="outline" onClick={buscarCnpj} disabled={buscandoCnpj}>
              {buscandoCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar CNPJ
            </Button>
          </div>
          <div className="space-y-2 md:col-span-7">
            <Label htmlFor="nome">Razão social *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="fant">Nome fantasia</Label>
            <Input id="fant" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-12">
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" value={cep} onChange={(e) => setCep(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-3 flex flex-col justify-end">
            <Button type="button" variant="outline" onClick={buscarCep} disabled={buscandoCep}>
              {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar CEP
            </Button>
          </div>
          <div className="space-y-2 md:col-span-6" />
          <div className="space-y-2 md:col-span-8">
            <Label htmlFor="log">Logradouro</Label>
            <Input id="log" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="num">Número</Label>
            <Input id="num" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="comp">Compl.</Label>
            <Input id="comp" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="mun">Município</Label>
            <Input id="mun" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ufc">UF</Label>
            <Input id="ufc" value={uf} maxLength={2} onChange={(e) => setUf(e.target.value.toUpperCase())} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Contato</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tel">Telefone</Label>
            <Input id="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mail">E-mail</Label>
            <Input id="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4" />
            Clínica ativa
          </label>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/clinicas">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !nome.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {clinica ? "Salvar alterações" : "Cadastrar clínica"}
        </Button>
      </div>
    </div>
  )
}

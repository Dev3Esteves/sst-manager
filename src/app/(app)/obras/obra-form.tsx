"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { UFS } from "@/lib/validations/obra"

type Obra = {
  id?: string
  empresa_id: string
  contratante_id?: string | null
  nome: string
  codigo?: string | null
  cnpj?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
  empreitada?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  ativa: boolean
}

type EmpresaOpcao = { id: string; razao_social: string }
type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function ObraForm({
  obra, donas, contratantes, action,
}: {
  obra?: Obra
  donas: EmpresaOpcao[]
  contratantes: EmpresaOpcao[]
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [empresaId, setEmpresaId] = useState(obra?.empresa_id || donas[0]?.id || "")
  const [contratanteId, setContratanteId] = useState(obra?.contratante_id || "")
  const [uf, setUf] = useState(obra?.uf || "")
  const [empreitada, setEmpreitada] = useState(obra?.empreitada || "")
  const [cnpj, setCnpj] = useState(obra?.cnpj ?? "")
  const [cep, setCep] = useState(obra?.cep ?? "")
  const [logradouro, setLogradouro] = useState(obra?.logradouro ?? "")
  const [numero, setNumero] = useState(obra?.numero ?? "")
  const [complemento, setComplemento] = useState(obra?.complemento ?? "")
  const [bairro, setBairro] = useState(obra?.bairro ?? "")
  const [cidade, setCidade] = useState(obra?.cidade ?? "")
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  async function buscarCnpj() {
    const limpo = cnpj.replace(/\D/g, "")
    if (limpo.length !== 14) { toast.warning("Informe um CNPJ com 14 dígitos."); return }
    setBuscandoCnpj(true)
    try {
      const r = await fetch(`/api/integracoes/brasilapi/cnpj?cnpj=${limpo}`)
      const j = await r.json()
      if (!r.ok || !j.ok) { toast.error(j.erro ?? "CNPJ não encontrado"); return }
      const d = j.data as Record<string, string | null>
      if (d.cep) setCep(d.cep)
      if (d.logradouro) setLogradouro(d.logradouro)
      if (d.numero) setNumero(d.numero)
      if (d.complemento) setComplemento(d.complemento)
      if (d.bairro) setBairro(d.bairro)
      if (d.municipio) setCidade(d.municipio)
      if (d.uf) setUf(d.uf)
      toast.success("Dados da Receita preenchidos. Confira antes de salvar.")
    } catch { toast.error("Falha ao consultar a Receita.") } finally { setBuscandoCnpj(false) }
  }

  async function buscarCep() {
    const limpo = cep.replace(/\D/g, "")
    if (limpo.length !== 8) { toast.warning("Informe um CEP com 8 dígitos."); return }
    setBuscandoCep(true)
    try {
      const r = await fetch(`/api/integracoes/brasilapi/cep?cep=${limpo}`)
      const j = await r.json()
      if (!r.ok || !j.ok) { toast.error(j.erro ?? "CEP não encontrado"); return }
      const d = j.data as Record<string, string | null>
      if (d.street) setLogradouro(d.street)
      if (d.neighborhood) setBairro(d.neighborhood)
      if (d.city) setCidade(d.city)
      if (d.state) setUf(d.state)
      toast.success("Endereço do CEP preenchido.")
    } catch { toast.error("Falha ao consultar o CEP.") } finally { setBuscandoCep(false) }
  }

  async function handleSubmit(formData: FormData) {
    formData.set("empresa_id", empresaId)
    formData.set("contratante_id", contratanteId || "none")
    formData.set("uf", uf || "none")
    formData.set("empreitada", empreitada || "none")
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
          <CardTitle>{obra ? "Editar obra" : "Nova obra"}</CardTitle>
          <CardDescription>
            Projeto/obra em andamento. Usado no cabeçalho de OS NR-01, Ficha de EPI e
            outros documentos oficiais, além de servir para alocar colaboradores em campo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome">Nome da obra *</Label>
            <Input
              id="nome" name="nome" defaultValue={obra?.nome}
              placeholder="DANTE / RACIONAL" required
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? "nome-error" : undefined}
            />
            {errors.nome && <p id="nome-error" role="alert" className="text-xs text-destructive">{errors.nome[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa_id">Empresa dona *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger id="empresa_id" aria-invalid={!!errors.empresa_id}
                aria-describedby={errors.empresa_id ? "empresa_id-error" : undefined}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {donas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.empresa_id
              ? <p id="empresa_id-error" role="alert" className="text-xs text-destructive">{errors.empresa_id[0]}</p>
              : <p className="text-xs text-muted-foreground">Quem executa a obra.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contratante_id">Contratante</Label>
            <Select
              value={contratanteId || "none"}
              onValueChange={(v) => setContratanteId(v === "none" ? "" : v)}
            >
              <SelectTrigger id="contratante_id"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— sem contratante —</SelectItem>
                {contratantes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Cliente para quem a obra é executada.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">Código interno</Label>
            <Input id="codigo" name="codigo" defaultValue={obra?.codigo ?? ""} placeholder="OBR-001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empreitada">Empreitada</Label>
            <Select value={empreitada || "none"} onValueChange={(v) => setEmpreitada(v === "none" ? "" : v)}>
              <SelectTrigger id="empreitada"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="total">Total</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Conforme o registro CNO (Receita).</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_inicio">Início</Label>
            <Input id="data_inicio" name="data_inicio" type="date" defaultValue={obra?.data_inicio ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_fim">Fim previsto</Label>
            <Input id="data_fim" name="data_fim" type="date" defaultValue={obra?.data_fim ?? ""} />
          </div>
          <div className="flex items-center space-x-2 md:col-span-2 pt-2">
            <input
              type="checkbox"
              id="ativa"
              name="ativa"
              defaultChecked={obra?.ativa ?? true}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="ativa">Obra ativa</Label>
          </div>
          {errors._form && (
            <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CNPJ e endereço da obra</CardTitle>
          <CardDescription>Busque pelo CNPJ (CNO/obra) para autopreencher o endereço.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-12">
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="cnpj">CNPJ da obra</Label>
            <Input id="cnpj" name="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" inputMode="numeric" />
          </div>
          <div className="space-y-2 md:col-span-3 flex flex-col justify-end">
            <Button type="button" variant="outline" onClick={buscarCnpj} disabled={buscandoCnpj}>
              {buscandoCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar CNPJ
            </Button>
          </div>
          <div className="md:col-span-4" />
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" name="cep" value={cep} onChange={(e) => setCep(e.target.value)} inputMode="numeric" placeholder="00000-000" />
          </div>
          <div className="space-y-2 md:col-span-3 flex flex-col justify-end">
            <Button type="button" variant="outline" onClick={buscarCep} disabled={buscandoCep}>
              {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar CEP
            </Button>
          </div>
          <div className="md:col-span-6" />
          <div className="space-y-2 md:col-span-8">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input id="logradouro" name="logradouro" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" name="numero" value={numero} onChange={(e) => setNumero(e.target.value)} inputMode="numeric" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="complemento">Compl.</Label>
            <Input id="complemento" name="complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" name="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" name="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Hortolândia" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="uf">UF</Label>
            <Select value={uf || "none"} onValueChange={(v) => setUf(v === "none" ? "" : v)}>
              <SelectTrigger id="uf"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/obras">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {obra ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

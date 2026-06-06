"use client"

import Link from "next/link"
import { useState, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Upload, X, ImageIcon, Search } from "lucide-react"
import { toast } from "sonner"

type Endereco = {
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  municipio?: string | null
  uf?: string | null
}

type Empresa = {
  id?: string
  razao_social: string
  nome_fantasia?: string | null
  cnpj: string
  inscricao_estadual?: string | null
  endereco?: Endereco | null
  telefones?: { principal?: string | null } | null
  tipo: string | null
  dona_sistema?: boolean | null
  empresa_mae_id?: string | null
  ativo: boolean
  logo_url?: string | null
}

type EmpresaOpcao = { id: string; razao_social: string }

type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function EmpresaForm({
  empresa,
  donasDisponiveis = [],
  action,
}: {
  empresa?: Empresa
  donasDisponiveis?: EmpresaOpcao[]
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()

  // Campos controlados (para permitir auto-preenchimento via BrasilAPI)
  const [cnpj, setCnpj] = useState(empresa?.cnpj ?? "")
  const [razaoSocial, setRazaoSocial] = useState(empresa?.razao_social ?? "")
  const [nomeFantasia, setNomeFantasia] = useState(empresa?.nome_fantasia ?? "")
  const end = empresa?.endereco ?? {}
  const [cep, setCep] = useState(end.cep ?? "")
  const [logradouro, setLogradouro] = useState(end.logradouro ?? "")
  const [numero, setNumero] = useState(end.numero ?? "")
  const [complemento, setComplemento] = useState(end.complemento ?? "")
  const [bairro, setBairro] = useState(end.bairro ?? "")
  const [municipio, setMunicipio] = useState(end.municipio ?? "")
  const [uf, setUf] = useState(end.uf ?? "")
  const [telefone, setTelefone] = useState(empresa?.telefones?.principal ?? "")

  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  const [tipo, setTipo] = useState(empresa?.tipo || "contratante")
  const [donaSistema, setDonaSistema] = useState<boolean>(empresa?.dona_sistema ?? false)
  const [empresaMaeId, setEmpresaMaeId] = useState<string>(empresa?.empresa_mae_id ?? "")

  const [logoPreview, setLogoPreview] = useState<string | null>(empresa?.logo_url ?? null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoAcao, setLogoAcao] = useState<"" | "remover">("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      if (d.razao_social) setRazaoSocial(d.razao_social)
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ _form: ["Logo deve ter no máximo 2 MB."] })
      return
    }
    setLogoFile(file)
    setLogoAcao("")
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removerLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoAcao("remover")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(formData: FormData) {
    formData.set("tipo", tipo)
    formData.set("dona_sistema", donaSistema ? "on" : "")
    formData.set("empresa_mae_id", donaSistema ? "" : empresaMaeId)
    if (logoAcao === "remover") formData.set("logo_acao", "remover")
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) {
        setErrors(result.error)
        if (result.error._form?.[0]) toast.error(result.error._form[0])
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle>{empresa ? "Editar empresa" : "Nova empresa"}</CardTitle>
          <CardDescription>
            Informe o CNPJ e clique em buscar para preencher os dados pela Receita Federal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <div className="flex gap-2">
              <Input
                id="cnpj" name="cnpj" value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00" required
              />
              <Button type="button" variant="outline" onClick={buscarCnpj} disabled={buscandoCnpj}>
                {buscandoCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>
            <FieldError error={errors.cnpj} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="razao_social">Razão social *</Label>
            <Input id="razao_social" name="razao_social" value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)} required />
            <FieldError error={errors.razao_social} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome fantasia</Label>
            <Input id="nome_fantasia" name="nome_fantasia" value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inscricao_estadual">Inscrição estadual</Label>
            <Input id="inscricao_estadual" name="inscricao_estadual"
              defaultValue={empresa?.inscricao_estadual ?? ""} />
          </div>
        </CardContent>
      </Card>

      {/* Endereço e contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Endereço e contato</CardTitle>
          <CardDescription>Usado nos cabeçalhos de documentos e relatórios emitidos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input id="cep" name="cep" value={cep} onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000" />
              <Button type="button" variant="outline" size="icon" onClick={buscarCep} disabled={buscandoCep}
                aria-label="Buscar CEP">
                {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2 md:col-span-4">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input id="logradouro" name="logradouro" value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" name="numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" name="complemento" value={complemento}
              onChange={(e) => setComplemento(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" name="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-4">
            <Label htmlFor="municipio">Município</Label>
            <Input id="municipio" name="municipio" value={municipio}
              onChange={(e) => setMunicipio(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="uf">UF</Label>
            <Input id="uf" name="uf" value={uf} maxLength={2}
              onChange={(e) => setUf(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" name="telefone" value={telefone}
              onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 0000-0000" />
          </div>
        </CardContent>
      </Card>

      {/* Classificação e vínculo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Classificação e vínculo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tipo">Classificação *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="propria">Dona do sistema (executa obras)</SelectItem>
                <SelectItem value="contratante">Contratante (cliente onde a dona atua)</SelectItem>
                <SelectItem value="terceira">Prestadora (presta serviço para a dona)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Define como esta empresa se relaciona com o sistema.</p>
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <input type="checkbox" id="ativo" name="ativo" defaultChecked={empresa?.ativo ?? true}
              className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="ativo">Empresa ativa</Label>
          </div>
          <div className="space-y-2 md:col-span-2 rounded-md border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <input type="checkbox" id="dona_sistema" checked={donaSistema}
                onChange={(e) => setDonaSistema(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-gray-300" />
              <div>
                <Label htmlFor="dona_sistema" className="font-semibold">
                  Esta é uma empresa dona do sistema (multi-tenant)
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quando marcado, a empresa hospeda seus próprios colaboradores, documentos e
                  relatórios, podendo ter contratantes e prestadoras vinculadas.
                </p>
              </div>
            </div>
          </div>
          {!donaSistema && donasDisponiveis.length > 0 && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="empresa_mae_id">Empresa dona responsável</Label>
              <Select value={empresaMaeId || "none"} onValueChange={(v) => setEmpresaMaeId(v === "none" ? "" : v)}>
                <SelectTrigger id="empresa_mae_id"><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {donasDisponiveis.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Opcional. Identifica a qual empresa dona esta prestadora/contratante pertence.
              </p>
            </div>
          )}
          {errors._form && (
            <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>
          )}
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logo da empresa</CardTitle>
          <CardDescription>
            Aparece no cabeçalho dos certificados de treinamento e demais documentos emitidos pela empresa.
            Formatos: PNG, JPG, WebP. Tamanho máximo: 2 MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="h-32 w-48 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/30 overflow-hidden">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Preview do logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground gap-1">
                  <ImageIcon className="h-8 w-8 opacity-50" />
                  <span className="text-xs">Sem logo</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <input ref={fileInputRef} id="logo" name="logo" type="file"
                accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
              <input type="hidden" name="logo_acao" value={logoAcao} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {logoPreview ? "Trocar logo" : "Enviar logo"}
                </Button>
                {logoPreview && (
                  <Button type="button" variant="ghost" onClick={removerLogo}>
                    <X className="h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>
              {logoFile && (
                <p className="text-xs text-muted-foreground">
                  Novo arquivo: <strong>{logoFile.name}</strong> ({(logoFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/empresas">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {empresa ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

function FieldError({ error }: { error?: string[] }) {
  if (!error?.length) return null
  return <p className="text-xs text-destructive">{error[0]}</p>
}

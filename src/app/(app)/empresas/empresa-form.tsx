"use client"

import Link from "next/link"
import { useState, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Upload, X, ImageIcon, Search, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  PAPEL_VALUES, PAPEL_LABEL,
  ENDERECO_TIPO_VALUES, ENDERECO_TIPO_LABEL,
  CONTATO_TIPO_VALUES, CONTATO_TIPO_LABEL,
  REGIME_TRIBUTARIO_VALUES, REGIME_TRIBUTARIO_LABEL,
  SITUACAO_CADASTRAL_VALUES, SITUACAO_CADASTRAL_LABEL,
} from "@/lib/validations/empresa"

type EnderecoRow = {
  tipo: string
  cep: string; logradouro: string; numero: string; complemento: string
  bairro: string; municipio: string; uf: string
  principal: boolean
}
type ContatoRow = {
  tipo: string; valor: string; nome_contato: string; cargo_contato: string; principal: boolean
}
type Fiscal = {
  inscricao_municipal: string; cnae_principal: string
  regime_tributario: string; situacao_cadastral: string
}

type Empresa = {
  id?: string
  razao_social: string
  nome_fantasia?: string | null
  cnpj: string
  inscricao_estadual?: string | null
  dona_sistema?: boolean | null
  empresa_mae_id?: string | null
  ativo: boolean
  logo_url?: string | null
  papeis?: string[]
  enderecos?: EnderecoRow[]
  contatos?: ContatoRow[]
  fiscal?: Partial<Fiscal> | null
}

type EmpresaOpcao = { id: string; razao_social: string }
type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

const TABS = [
  { key: "identificacao", label: "Identificação" },
  { key: "fiscal", label: "Fiscal" },
  { key: "enderecos", label: "Endereços" },
  { key: "contatos", label: "Contatos" },
  { key: "papeis", label: "Papéis & Vínculos" },
  { key: "logo", label: "Logo" },
] as const
type TabKey = (typeof TABS)[number]["key"]

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

const enderecoVazio = (): EnderecoRow => ({
  tipo: "sede", cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", municipio: "", uf: "", principal: false,
})
const contatoVazio = (): ContatoRow => ({
  tipo: "telefone", valor: "", nome_contato: "", cargo_contato: "", principal: false,
})

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
  const [tab, setTab] = useState<TabKey>("identificacao")

  // Identificação
  const [cnpj, setCnpj] = useState(empresa?.cnpj ?? "")
  const [razaoSocial, setRazaoSocial] = useState(empresa?.razao_social ?? "")
  const [nomeFantasia, setNomeFantasia] = useState(empresa?.nome_fantasia ?? "")
  const [inscricaoEstadual, setInscricaoEstadual] = useState(empresa?.inscricao_estadual ?? "")
  const [ativo, setAtivo] = useState<boolean>(empresa?.ativo ?? true)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)

  // Fiscal
  const [fiscal, setFiscal] = useState<Fiscal>({
    inscricao_municipal: empresa?.fiscal?.inscricao_municipal ?? "",
    cnae_principal: empresa?.fiscal?.cnae_principal ?? "",
    regime_tributario: empresa?.fiscal?.regime_tributario ?? "",
    situacao_cadastral: empresa?.fiscal?.situacao_cadastral ?? "",
  })

  // Endereços / Contatos
  const [enderecos, setEnderecos] = useState<EnderecoRow[]>(
    empresa?.enderecos?.length ? empresa.enderecos.map((e) => ({ ...enderecoVazio(), ...e })) : [],
  )
  const [contatos, setContatos] = useState<ContatoRow[]>(
    empresa?.contatos?.length ? empresa.contatos.map((c) => ({ ...contatoVazio(), ...c })) : [],
  )
  const [cepLoading, setCepLoading] = useState<number | null>(null)

  // Papéis & vínculos
  const [papeis, setPapeis] = useState<string[]>(empresa?.papeis ?? [])
  const [donaSistema, setDonaSistema] = useState<boolean>(empresa?.dona_sistema ?? false)
  const [empresaMaeId, setEmpresaMaeId] = useState<string>(empresa?.empresa_mae_id ?? "")

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(empresa?.logo_url ?? null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoAcao, setLogoAcao] = useState<"" | "remover">("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // -- Endereços helpers ------------------------------------------------------
  function addEndereco() {
    setEnderecos((prev) => [...prev, { ...enderecoVazio(), principal: prev.length === 0 }])
  }
  function removeEndereco(i: number) {
    setEnderecos((prev) => {
      const next = prev.filter((_, idx) => idx !== i)
      if (next.length && !next.some((e) => e.principal)) next[0].principal = true
      return next
    })
  }
  function updEndereco(i: number, patch: Partial<EnderecoRow>) {
    setEnderecos((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  }
  function setEnderecoPrincipal(i: number) {
    setEnderecos((prev) => prev.map((e, idx) => ({ ...e, principal: idx === i })))
  }

  // -- Contatos helpers -------------------------------------------------------
  function addContato() {
    setContatos((prev) => [...prev, contatoVazio()])
  }
  function removeContato(i: number) {
    setContatos((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updContato(i: number, patch: Partial<ContatoRow>) {
    setContatos((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }
  function setContatoPrincipal(i: number, value: boolean) {
    setContatos((prev) => prev.map((c, idx) => ({ ...c, principal: idx === i ? value : false })))
  }

  // -- Papéis -----------------------------------------------------------------
  function togglePapel(p: string) {
    setPapeis((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }
  function toggleDona(checked: boolean) {
    setDonaSistema(checked)
    if (checked) setPapeis((prev) => (prev.includes("dona") ? prev : [...prev, "dona"]))
  }

  // -- BrasilAPI --------------------------------------------------------------
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
      const sit = d.situacao_cadastral?.toLowerCase()
      if (sit && (SITUACAO_CADASTRAL_VALUES as readonly string[]).includes(sit)) {
        setFiscal((f) => ({ ...f, situacao_cadastral: sit }))
      }
      // Preenche (ou cria) o endereço principal com os dados da Receita.
      setEnderecos((prev) => {
        const base = prev.length ? [...prev] : [{ ...enderecoVazio(), principal: true }]
        let idx = base.findIndex((e) => e.principal)
        if (idx < 0) idx = 0
        base[idx] = {
          ...base[idx],
          cep: d.cep ?? base[idx].cep,
          logradouro: d.logradouro ?? base[idx].logradouro,
          numero: d.numero ?? base[idx].numero,
          complemento: d.complemento ?? base[idx].complemento,
          bairro: d.bairro ?? base[idx].bairro,
          municipio: d.municipio ?? base[idx].municipio,
          uf: d.uf ?? base[idx].uf,
        }
        return base.map((e, i) => ({ ...e, principal: i === idx }))
      })
      toast.success("Dados da Receita preenchidos. Confira antes de salvar.")
    } catch {
      toast.error("Falha ao consultar a Receita. Preencha manualmente.")
    } finally {
      setBuscandoCnpj(false)
    }
  }

  async function buscarCep(i: number) {
    const limpo = (enderecos[i]?.cep ?? "").replace(/\D/g, "")
    if (limpo.length !== 8) {
      toast.warning("Informe um CEP com 8 dígitos para buscar.")
      return
    }
    setCepLoading(i)
    try {
      const r = await fetch(`/api/integracoes/brasilapi/cep?cep=${limpo}`)
      const j = await r.json()
      if (!r.ok || !j.ok) {
        toast.error(j.erro ?? "CEP não encontrado")
        return
      }
      const d = j.data as Record<string, string | null>
      updEndereco(i, {
        logradouro: d.street ?? enderecos[i].logradouro,
        bairro: d.neighborhood ?? enderecos[i].bairro,
        municipio: d.city ?? enderecos[i].municipio,
        uf: d.state ?? enderecos[i].uf,
      })
      toast.success("Endereço do CEP preenchido.")
    } catch {
      toast.error("Falha ao consultar o CEP.")
    } finally {
      setCepLoading(null)
    }
  }

  // -- Logo -------------------------------------------------------------------
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

  // -- Submit -----------------------------------------------------------------
  async function handleSubmit(formData: FormData) {
    // Garante exatamente um endereço principal quando houver endereços.
    let ends = enderecos
    if (ends.length && !ends.some((e) => e.principal)) {
      ends = ends.map((e, i) => ({ ...e, principal: i === 0 }))
    }
    const fiscalPayload =
      fiscal.inscricao_municipal || fiscal.cnae_principal || fiscal.regime_tributario || fiscal.situacao_cadastral
        ? {
            inscricao_municipal: fiscal.inscricao_municipal || null,
            cnae_principal: fiscal.cnae_principal || null,
            regime_tributario: fiscal.regime_tributario || null,
            situacao_cadastral: fiscal.situacao_cadastral || null,
          }
        : null

    const payload = {
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia || null,
      cnpj,
      inscricao_estadual: inscricaoEstadual || null,
      dona_sistema: donaSistema,
      ativo,
      empresa_mae_id: donaSistema ? null : empresaMaeId || null,
      papeis,
      enderecos: ends,
      contatos,
      fiscal: fiscalPayload,
    }
    formData.set("payload", JSON.stringify(payload))
    if (logoAcao === "remover") formData.set("logo_acao", "remover")

    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) {
        setErrors(result.error)
        if (result.error._form?.[0]) toast.error(result.error._form[0])
        // Leva o usuário à aba do primeiro erro relevante.
        if (result.error.papeis) setTab("papeis")
        else if (result.error.enderecos) setTab("enderecos")
        else if (result.error.contatos) setTab("contatos")
        else if (result.error.razao_social || result.error.cnpj) setTab("identificacao")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {empresa ? "Editar empresa" : "Nova empresa"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Parceiro de negócio: identidade única com papéis, endereços e contatos.
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* IDENTIFICAÇÃO */}
      {tab === "identificacao" && (
        <Card>
          <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <div className="flex gap-2">
                <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00" required />
                <Button type="button" variant="outline" onClick={buscarCnpj} disabled={buscandoCnpj}>
                  {buscandoCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </Button>
              </div>
              <FieldError error={errors.cnpj} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="razao_social">Razão social *</Label>
              <Input id="razao_social" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} required />
              <FieldError error={errors.razao_social} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome fantasia</Label>
              <Input id="nome_fantasia" value={nomeFantasia ?? ""} onChange={(e) => setNomeFantasia(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inscricao_estadual">Inscrição estadual</Label>
              <Input id="inscricao_estadual" value={inscricaoEstadual ?? ""}
                onChange={(e) => setInscricaoEstadual(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="ativo" checked={ativo} onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="ativo">Empresa ativa</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FISCAL */}
      {tab === "fiscal" && (
        <Card>
          <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE principal</Label>
              <Input id="cnae" value={fiscal.cnae_principal} placeholder="00.00-0-00"
                onChange={(e) => setFiscal((f) => ({ ...f, cnae_principal: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inscricao_municipal">Inscrição municipal</Label>
              <Input id="inscricao_municipal" value={fiscal.inscricao_municipal}
                onChange={(e) => setFiscal((f) => ({ ...f, inscricao_municipal: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regime">Regime tributário</Label>
              <select id="regime" className={selectCls} value={fiscal.regime_tributario}
                onChange={(e) => setFiscal((f) => ({ ...f, regime_tributario: e.target.value }))}>
                <option value="">—</option>
                {REGIME_TRIBUTARIO_VALUES.map((v) => (
                  <option key={v} value={v}>{REGIME_TRIBUTARIO_LABEL[v]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="situacao">Situação cadastral</Label>
              <select id="situacao" className={selectCls} value={fiscal.situacao_cadastral}
                onChange={(e) => setFiscal((f) => ({ ...f, situacao_cadastral: e.target.value }))}>
                <option value="">—</option>
                {SITUACAO_CADASTRAL_VALUES.map((v) => (
                  <option key={v} value={v}>{SITUACAO_CADASTRAL_LABEL[v]}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ENDEREÇOS */}
      {tab === "enderecos" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <FieldError error={errors.enderecos} />
            {enderecos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum endereço. Adicione ao menos a sede.</p>
            )}
            {enderecos.map((e, i) => (
              <div key={i} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <select className={cn(selectCls, "w-40")} value={e.tipo}
                      onChange={(ev) => updEndereco(i, { tipo: ev.target.value })}>
                      {ENDERECO_TIPO_VALUES.map((v) => (
                        <option key={v} value={v}>{ENDERECO_TIPO_LABEL[v]}</option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-1.5 text-sm">
                      <input type="radio" name="endereco_principal" checked={e.principal}
                        onChange={() => setEnderecoPrincipal(i)} className="h-4 w-4" />
                      Principal
                    </label>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEndereco(i)}
                    aria-label="Remover endereço">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-6">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">CEP</Label>
                    <div className="flex gap-2">
                      <Input value={e.cep} onChange={(ev) => updEndereco(i, { cep: ev.target.value })}
                        placeholder="00000-000" />
                      <Button type="button" variant="outline" size="icon" onClick={() => buscarCep(i)}
                        disabled={cepLoading === i} aria-label="Buscar CEP">
                        {cepLoading === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <Label className="text-xs">Logradouro</Label>
                    <Input value={e.logradouro} onChange={(ev) => updEndereco(i, { logradouro: ev.target.value })} />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label className="text-xs">Número</Label>
                    <Input value={e.numero} onChange={(ev) => updEndereco(i, { numero: ev.target.value })} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Complemento</Label>
                    <Input value={e.complemento} onChange={(ev) => updEndereco(i, { complemento: ev.target.value })} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Bairro</Label>
                    <Input value={e.bairro} onChange={(ev) => updEndereco(i, { bairro: ev.target.value })} />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label className="text-xs">Município</Label>
                    <Input value={e.municipio} onChange={(ev) => updEndereco(i, { municipio: ev.target.value })} />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label className="text-xs">UF</Label>
                    <Input value={e.uf} maxLength={2}
                      onChange={(ev) => updEndereco(i, { uf: ev.target.value.toUpperCase() })} />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEndereco}>
              <Plus className="h-4 w-4" /> Adicionar endereço
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CONTATOS */}
      {tab === "contatos" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <FieldError error={errors.contatos} />
            {contatos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
            )}
            {contatos.map((c, i) => (
              <div key={i} className="grid gap-3 md:grid-cols-12 items-end rounded-md border p-3">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Tipo</Label>
                  <select className={selectCls} value={c.tipo}
                    onChange={(ev) => updContato(i, { tipo: ev.target.value })}>
                    {CONTATO_TIPO_VALUES.map((v) => (
                      <option key={v} value={v}>{CONTATO_TIPO_LABEL[v]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Valor</Label>
                  <Input value={c.valor} onChange={(ev) => updContato(i, { valor: ev.target.value })}
                    placeholder={c.tipo === "email" ? "contato@exemplo.com" : "(00) 0000-0000"} />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Nome do contato</Label>
                  <Input value={c.nome_contato} onChange={(ev) => updContato(i, { nome_contato: ev.target.value })} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Cargo</Label>
                  <Input value={c.cargo_contato} onChange={(ev) => updContato(i, { cargo_contato: ev.target.value })} />
                </div>
                <div className="md:col-span-2 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={c.principal}
                      onChange={(ev) => setContatoPrincipal(i, ev.target.checked)} className="h-4 w-4" />
                    Principal
                  </label>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeContato(i)}
                    aria-label="Remover contato">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addContato}>
              <Plus className="h-4 w-4" /> Adicionar contato
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PAPÉIS & VÍNCULOS */}
      {tab === "papeis" && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label>Papéis de negócio *</Label>
              <p className="text-xs text-muted-foreground">
                Uma mesma empresa pode ter mais de um papel (ex.: cliente e prestadora).
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAPEL_VALUES.map((p) => (
                  <label key={p} className="inline-flex items-center gap-2 text-sm rounded-md border p-2.5">
                    <input type="checkbox" checked={papeis.includes(p)} onChange={() => togglePapel(p)}
                      className="h-4 w-4 rounded border-gray-300" />
                    {PAPEL_LABEL[p]}
                  </label>
                ))}
              </div>
              <FieldError error={errors.papeis} />
            </div>

            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={donaSistema} onChange={(e) => toggleDona(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-gray-300" />
                <span>
                  <span className="font-semibold text-sm">Empresa dona do sistema (multi-tenant)</span>
                  <span className="block text-xs text-muted-foreground">
                    Hospeda seus próprios colaboradores, documentos e relatórios. É a unidade
                    organizacional — distinto do papel de negócio.
                  </span>
                </span>
              </label>
            </div>

            {!donaSistema && donasDisponiveis.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="empresa_mae">Empresa dona responsável (vínculo de grupo)</Label>
                <select id="empresa_mae" className={selectCls} value={empresaMaeId}
                  onChange={(e) => setEmpresaMaeId(e.target.value)}>
                  <option value="">Sem vínculo</option>
                  {donasDisponiveis.map((d) => (
                    <option key={d.id} value={d.id}>{d.razao_social}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Opcional. A qual empresa dona este parceiro pertence.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LOGO */}
      {tab === "logo" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">
              Aparece no cabeçalho dos certificados e documentos emitidos. PNG, JPG ou WebP até 2 MB.
            </p>
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
                      <X className="h-4 w-4" /> Remover
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
      )}

      {errors._form && (
        <p className="text-sm text-destructive" role="alert">{errors._form[0]}</p>
      )}

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

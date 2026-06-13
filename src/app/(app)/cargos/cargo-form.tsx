"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Plus, X, ShieldCheck, AlertTriangle } from "lucide-react"
import { NRS_DISPONIVEIS, type EpiPorCargoItem, type EpisPorCargo, EPIS_POR_CARGO_VAZIO } from "@/lib/validations/cargo"

type Cargo = {
  id?: string
  empresa_id: string
  titulo: string
  cbo?: string | null
  grupo_risco?: number | null
  descricao_atividades?: string | null
  nrs_aplicaveis?: string[] | null
  epis_obrigatorios?: EpisPorCargo | null
}

type Empresa = { id: string; razao_social: string }
type EpiOpcao = { id: string; descricao: string; ca?: string | null }
type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function CargoForm({
  cargo, empresas, episDisponiveis = [], action,
}: {
  cargo?: Cargo
  empresas: Empresa[]
  episDisponiveis?: EpiOpcao[]
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [empresaId, setEmpresaId] = useState(cargo?.empresa_id || empresas[0]?.id || "")
  const [grupoRisco, setGrupoRisco] = useState(cargo?.grupo_risco?.toString() || "")
  const [nrs, setNrs] = useState<string[]>(cargo?.nrs_aplicaveis ?? [])

  const initialEpis: EpisPorCargo = cargo?.epis_obrigatorios ?? EPIS_POR_CARGO_VAZIO
  const [obrigatorios, setObrigatorios] = useState<EpiPorCargoItem[]>(initialEpis.obrigatorios ?? [])
  const [eventuais, setEventuais] = useState<EpiPorCargoItem[]>(initialEpis.eventuais ?? [])

  function toggleNr(nr: string) {
    setNrs((prev) => prev.includes(nr) ? prev.filter(x => x !== nr) : [...prev, nr])
  }

  async function handleSubmit(formData: FormData) {
    formData.set("empresa_id", empresaId)
    if (grupoRisco) formData.set("grupo_risco", grupoRisco)
    formData.delete("nrs_aplicaveis")
    nrs.forEach(nr => formData.append("nrs_aplicaveis", nr))
    formData.set("epis_obrigatorios", JSON.stringify({ obrigatorios, eventuais }))
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) {
        setErrors(result.error)
        const primeiro = Object.keys(result.error).find((k) => k !== "_form")
        if (primeiro) setTimeout(() => document.getElementById(primeiro)?.focus(), 0)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{cargo ? "Editar cargo" : "Novo cargo"}</CardTitle>
          <CardDescription>Defina CBO, NRs aplicáveis e grupo de risco.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" name="titulo" defaultValue={cargo?.titulo} required
              aria-invalid={!!errors.titulo} aria-describedby={errors.titulo ? "titulo-error" : undefined} />
            <FieldError error={errors.titulo} id="titulo-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa_id">Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger id="empresa_id" aria-invalid={!!errors.empresa_id}
                aria-describedby={errors.empresa_id ? "empresa_id-error" : undefined}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError error={errors.empresa_id} id="empresa_id-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cbo">CBO</Label>
            <Input id="cbo" name="cbo" defaultValue={cargo?.cbo ?? ""} placeholder="0000-00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grupo_risco">Grupo de Risco (1-4)</Label>
            <Select value={grupoRisco} onValueChange={setGrupoRisco}>
              <SelectTrigger id="grupo_risco"><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Baixo</SelectItem>
                <SelectItem value="2">2 — Médio</SelectItem>
                <SelectItem value="3">3 — Alto</SelectItem>
                <SelectItem value="4">4 — Muito alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>NRs aplicáveis</Label>
            <div className="flex flex-wrap gap-2">
              {NRS_DISPONIVEIS.map(nr => (
                <label key={nr} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 cursor-pointer hover:bg-accent text-sm">
                  <input
                    type="checkbox"
                    checked={nrs.includes(nr)}
                    onChange={() => toggleNr(nr)}
                    className="h-3.5 w-3.5"
                  />
                  {nr}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descricao_atividades">Descrição das atividades</Label>
            <textarea
              id="descricao_atividades" name="descricao_atividades"
              defaultValue={cargo?.descricao_atividades ?? ""}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {errors._form && <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            EPIs associados à função
          </CardTitle>
          <CardDescription>
            Usado para pré-preencher a Ficha de EPI do colaborador e o item
            <strong> Medidas Preventivas</strong> da Ordem de Serviço NR-01.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ListaEpis
            titulo="Obrigatórios (sempre devem ser usados)"
            descricao="Entregues no primeiro fornecimento e substituídos conforme desgaste."
            lista={obrigatorios}
            setLista={setObrigatorios}
            episDisponiveis={episDisponiveis}
            corBadge="bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/30"
          />
          <ListaEpis
            titulo="Eventuais (uso conforme situação específica)"
            descricao="Ex.: avental de raspa apenas quando em solda, óculos de corte apenas em esmeril."
            lista={eventuais}
            setLista={setEventuais}
            episDisponiveis={episDisponiveis}
            corBadge="bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30"
          />
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/cargos">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {cargo ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

function FieldError({ error, id }: { error?: string[]; id?: string }) {
  if (!error?.length) return null
  return <p id={id} role="alert" className="text-xs text-destructive">{error[0]}</p>
}

function ListaEpis({
  titulo, descricao, lista, setLista, episDisponiveis, corBadge,
}: {
  titulo: string
  descricao: string
  lista: EpiPorCargoItem[]
  setLista: (l: EpiPorCargoItem[]) => void
  episDisponiveis: EpiOpcao[]
  corBadge: string
}) {
  const [epiId, setEpiId] = useState<string>("")
  const [obs, setObs] = useState<string>("")

  const disponiveis = episDisponiveis.filter(
    (e) => !lista.some((x) => x.epi_id === e.id),
  )

  function adicionar() {
    if (!epiId) return
    setLista([...lista, { epi_id: epiId, observacao: obs || null }])
    setEpiId("")
    setObs("")
  }

  function remover(id: string) {
    setLista(lista.filter((x) => x.epi_id !== id))
  }

  function atualizarObs(id: string, novaObs: string) {
    setLista(lista.map((x) => x.epi_id === id ? { ...x, observacao: novaObs || null } : x))
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </div>

      {/* Lista atual */}
      {lista.length > 0 ? (
        <ul className="space-y-2">
          {lista.map((item) => {
            const epi = episDisponiveis.find((e) => e.id === item.epi_id)
            return (
              <li key={item.epi_id} className="flex items-start gap-2 rounded-md border p-2">
                <span className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${corBadge}`}>
                  {epi?.ca ? `CA ${epi.ca}` : "EPI"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{epi?.descricao ?? "(EPI removido)"}</div>
                  <Input
                    value={item.observacao ?? ""}
                    onChange={(e) => atualizarObs(item.epi_id, e.target.value)}
                    placeholder="Observação (ex.: Classe 3 para MT)"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <Button
                  type="button" variant="ghost" size="icon"
                  onClick={() => remover(item.epi_id)}
                  aria-label="Remover EPI"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Nenhum EPI cadastrado nesta lista.
        </div>
      )}

      {/* Adicionar novo */}
      {disponiveis.length > 0 && (
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] items-end">
          <div className="space-y-1">
            <Label className="text-xs">EPI</Label>
            <Select value={epiId} onValueChange={setEpiId}>
              <SelectTrigger aria-label="Selecionar EPI"><SelectValue placeholder="Selecione um EPI" /></SelectTrigger>
              <SelectContent>
                {disponiveis.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.descricao}{e.ca ? ` (CA ${e.ca})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Observação (opcional)</Label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: Classe 3 para MT" aria-label="Observação do EPI" />
          </div>
          <Button type="button" onClick={adicionar} disabled={!epiId}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, MinusCircle, Camera, CloudOff, X } from "lucide-react"
import { calcConformidade, type InspecaoInput, type RespostaItem, type TemplateItem } from "@/lib/validations/inspecao"
import { useOnline } from "@/hooks/use-online"
import { enqueueMutation } from "@/lib/offline/db"
import { compressImage } from "@/lib/image/compress"

type Empresa = { id: string; razao_social: string }
type ObraLocal = { id: string; nome: string; obra_nome: string }
type FormErrors = { _form?: string[] }

const SEM_LOCAL = "__sem_local__"

export function InspecaoForm({
  template, empresas, action, obraLocais = [],
}: {
  template: { id: string; titulo: string; categoria: string | null; itens: TemplateItem[] }
  empresas: Empresa[]
  action: (payload: InspecaoInput) => Promise<{ error?: FormErrors } | void>
  obraLocais?: ObraLocal[]
}) {
  const router = useRouter()
  const online = useOnline()
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id || "")
  const [local, setLocal] = useState("")
  const [obraLocalId, setObraLocalId] = useState("")

  function selecionarObraLocal(id: string) {
    if (id === SEM_LOCAL) { setObraLocalId(""); return }
    setObraLocalId(id)
    const ol = obraLocais.find((o) => o.id === id)
    if (ol) setLocal(`${ol.obra_nome} — ${ol.nome}`)
  }
  const [dataInspecao, setDataInspecao] = useState(new Date().toISOString().slice(0, 10))
  const [observacoes, setObservacoes] = useState("")
  const [respostas, setRespostas] = useState<RespostaItem[]>(
    template.itens.map((it, i) => ({
      item_index: i,
      pergunta: it.pergunta,
      grupo: it.grupo ?? null,
      conforme: "sim",
      observacao: null,
      foto_url: null,
    }))
  )

  const conformidade = useMemo(() => calcConformidade(respostas), [respostas])

  function updateResposta(i: number, patch: Partial<RespostaItem>) {
    setRespostas((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  function handleSubmit() {
    const payload: InspecaoInput = {
      template_id: template.id,
      empresa_id: empresaId,
      local,
      data_inspecao: dataInspecao,
      respostas,
      observacoes_gerais: observacoes || null,
      obra_local_id: obraLocalId || null,
    }

    // Offline → fila IndexedDB; volta para listagem com toast de "pendente"
    if (!online) {
      startTransition(async () => {
        try {
          await enqueueMutation({
            type: "inspecao",
            endpoint: "/api/sync/inspecoes",
            payload,
          })
          router.push("/inspecoes?offline=1")
        } catch (e) {
          setErrors({ _form: [(e as Error).message] })
        }
      })
      return
    }

    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  // Agrupa itens por grupo
  const grupos = useMemo(() => {
    const map = new Map<string, RespostaItem[]>()
    respostas.forEach((r) => {
      const g = r.grupo ?? "Geral"
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(r)
    })
    return Array.from(map.entries())
  }, [respostas])

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{template.titulo}</h1>
        {template.categoria && <p className="text-sm text-muted-foreground capitalize">Categoria: {template.categoria}</p>}
      </div>

      <div className="sticky top-16 z-[5] bg-background/95 backdrop-blur py-3 border-b -mx-6 px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-muted-foreground">Conformidade</div>
            <div className="text-2xl font-bold">{conformidade}%</div>
          </div>
          <div className="h-2 flex-1 max-w-md bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                conformidade >= 90 ? "bg-status-regular" :
                conformidade >= 70 ? "bg-status-alerta" :
                conformidade >= 50 ? "bg-status-critico" : "bg-status-vencido"
              }`}
              style={{ width: `${conformidade}%` }}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {obraLocais.length > 0 && (
            <div className="space-y-2">
              <Label>Obra / Local</Label>
              <Select value={obraLocalId || SEM_LOCAL} onValueChange={selecionarObraLocal}>
                <SelectTrigger><SelectValue placeholder="Vincular a um local da obra" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_LOCAL}>— Não vincular —</SelectItem>
                  {obraLocais.map((ol) => (
                    <SelectItem key={ol.id} value={ol.id}>{ol.obra_nome} — {ol.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="local">Local *</Label>
            <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Obra/área/equipamento" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="di">Data *</Label>
            <Input id="di" type="date" value={dataInspecao} onChange={(e) => setDataInspecao(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {grupos.map(([grupo, itens]) => (
        <Card key={grupo}>
          <CardHeader>
            <CardTitle className="text-base">{grupo}</CardTitle>
            <CardDescription>{itens.length} itens neste grupo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {itens.map((r) => {
              const i = r.item_index
              return (
                <div key={i} className="rounded-md border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{i + 1}. {r.pergunta}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <ConformidadeButton
                      active={r.conforme === "sim"}
                      variant="regular"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      label="Conforme"
                      onClick={() => updateResposta(i, { conforme: "sim" })}
                    />
                    <ConformidadeButton
                      active={r.conforme === "nao"}
                      variant="vencido"
                      icon={<XCircle className="h-4 w-4" />}
                      label="Não conforme"
                      onClick={() => updateResposta(i, { conforme: "nao" })}
                    />
                    <ConformidadeButton
                      active={r.conforme === "na"}
                      variant="muted"
                      icon={<MinusCircle className="h-4 w-4" />}
                      label="N/A"
                      onClick={() => updateResposta(i, { conforme: "na" })}
                    />
                  </div>
                  {r.conforme === "nao" && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs">Observação (obrigatória em NC)</Label>
                      <textarea
                        value={r.observacao ?? ""}
                        onChange={(e) => updateResposta(i, { observacao: e.target.value })}
                        rows={2}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Descreva a não conformidade e ação imediata"
                      />
                      <FotoField
                        value={r.foto_url ?? null}
                        onChange={(foto_url) => updateResposta(i, { foto_url })}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle className="text-base">Observações gerais</CardTitle></CardHeader>
        <CardContent>
          <textarea
            value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Conclusões, recomendações..."
          />
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t -mx-6 px-6">
        <Button type="button" variant="outline" asChild>
          <Link href="/inspecoes/new">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !local}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {!online && <CloudOff className="h-4 w-4" />}
          {online ? "Finalizar inspeção" : "Salvar offline"}
        </Button>
      </div>
    </div>
  )
}

function FotoField({
  value,
  onChange,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro(null)
    setBusy(true)
    try {
      const dataUrl = await compressImage(file)
      onChange(dataUrl)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      {value ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Evidência da não-conformidade"
            className="h-24 w-24 rounded-md border object-cover"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X className="h-4 w-4" /> Remover foto
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {busy ? "Processando..." : "Adicionar foto"}
        </Button>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}

function ConformidadeButton({
  active, variant, icon, label, onClick,
}: {
  active: boolean
  variant: "regular" | "vencido" | "muted"
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  const colors = {
    regular: active ? "bg-status-regular text-white border-status-regular" : "hover:bg-status-regular/10",
    vencido: active ? "bg-status-vencido text-white border-status-vencido" : "hover:bg-status-vencido/10",
    muted: active ? "bg-muted-foreground text-white border-muted-foreground" : "hover:bg-muted",
  }[variant]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-2.5 text-xs font-medium transition-colors ${colors}`}
    >
      {icon}
      {label}
    </button>
  )
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Package, Search, Users, AlertTriangle, CheckCircle2, ArrowLeft, FileArchive, ListTodo } from "lucide-react"
import { MAX_LOTE } from "@/lib/pdf/batch-utils"
import { formatCPF } from "@/lib/validations/shared"

type Empresa = { id: string; razao_social: string }
type Colaborador = { id: string; nome_completo: string; cpf: string; empresa_id: string; cargo_titulo: string | null }
type Treinamento = { id: string; titulo: string; nr_referencia: string | null; carga_horaria_horas: number }
type TipoLote = "autorizacao_nr" | "certificado"

export function LoteForm({
  empresas, colaboradores, treinamentos,
}: {
  empresas: Empresa[]
  colaboradores: Colaborador[]
  treinamentos: Treinamento[]
}) {
  const [tipo, setTipo] = useState<TipoLote>("autorizacao_nr")
  const [nr, setNr] = useState<"NR-10" | "NR-35" | "NR-33">("NR-10")
  const [treinamentoId, setTreinamentoId] = useState("")
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id || "")
  const [registrar, setRegistrar] = useState(true)
  const [responsavelNome, setResponsavelNome] = useState("")
  const [responsavelCargo, setResponsavelCargo] = useState("Engenheiro de Segurança do Trabalho")
  const [busca, setBusca] = useState("")
  const [filtroCargo, setFiltroCargo] = useState("")
  const [filtroEmpresa, setFiltroEmpresa] = useState("")
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const cargosUnicos = useMemo(() => {
    const set = new Set<string>()
    colaboradores.forEach((c) => c.cargo_titulo && set.add(c.cargo_titulo))
    return Array.from(set).sort()
  }, [colaboradores])

  const colaboradoresFiltrados = useMemo(() => {
    return colaboradores.filter((c) => {
      if (busca && !c.nome_completo.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtroCargo && c.cargo_titulo !== filtroCargo) return false
      if (filtroEmpresa && c.empresa_id !== filtroEmpresa) return false
      return true
    })
  }, [colaboradores, busca, filtroCargo, filtroEmpresa])

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        if (next.size >= MAX_LOTE) {
          toast.warning(`Máximo ${MAX_LOTE} colaboradores por lote.`)
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  function selectAllVisible() {
    const toAdd = colaboradoresFiltrados.slice(0, MAX_LOTE - selecionados.size).map((c) => c.id)
    setSelecionados((prev) => {
      const next = new Set(prev)
      for (const id of toAdd) {
        if (next.size >= MAX_LOTE) break
        next.add(id)
      }
      if (next.size === MAX_LOTE && colaboradoresFiltrados.length > MAX_LOTE) {
        toast.info(`Seleção limitada a ${MAX_LOTE} colaboradores.`)
      }
      return next
    })
  }

  function clearAll() {
    setSelecionados(new Set())
  }

  async function handleGerar() {
    if (selecionados.size === 0) {
      toast.warning("Selecione ao menos 1 colaborador.")
      return
    }
    if (tipo === "certificado" && !treinamentoId) {
      toast.warning("Escolha o treinamento do certificado.")
      return
    }
    if (tipo === "autorizacao_nr" && !responsavelNome) {
      toast.warning("Informe o nome do responsável pela emissão.")
      return
    }

    const ids = Array.from(selecionados)
    const body = tipo === "autorizacao_nr"
      ? {
          tipo,
          nr,
          empresa_id: empresaId,
          colaborador_ids: ids,
          registrar,
          responsavel_nome: responsavelNome,
          responsavel_cargo: responsavelCargo,
        }
      : {
          tipo,
          treinamento_id: treinamentoId,
          colaborador_ids: ids,
        }

    startTransition(async () => {
      try {
        const res = await fetch("/api/documentos/lote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Erro desconhecido" }))
          toast.error(data.error || "Falha ao gerar lote", {
            description: Array.isArray(data.resultados)
              ? `${data.resultados.filter((r: { status: string }) => r.status === "pulado").length} colaborador(es) sem pré-requisitos.`
              : undefined,
          })
          return
        }

        // Baixa o ZIP
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const disposition = res.headers.get("Content-Disposition") ?? ""
        const match = disposition.match(/filename="([^"]+)"/)
        const filename = match?.[1] ?? `lote_${Date.now()}.zip`
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)

        const gerados = res.headers.get("X-Lote-Gerado") ?? "?"
        const pulados = res.headers.get("X-Lote-Pulado") ?? "0"
        toast.success(`${gerados} documento(s) gerado(s)`, {
          description: pulados !== "0"
            ? `${pulados} pulado(s) — veja _relatorio.txt no ZIP.`
            : "Todos OK. Baixando ZIP...",
        })
      } catch (err) {
        toast.error("Erro de rede", {
          description: err instanceof Error ? err.message : String(err),
        })
      }
    })
  }

  /**
   * Caminho assíncrono: enfileira o job e redireciona pra /jobs onde o
   * usuário acompanha progresso e baixa quando pronto. Recomendado pra
   * lotes > 10 colaboradores (evita estourar timeout do Vercel).
   */
  async function handleGerarAsync() {
    if (selecionados.size === 0) {
      toast.warning("Selecione ao menos 1 colaborador.")
      return
    }
    if (tipo === "certificado" && !treinamentoId) {
      toast.warning("Escolha o treinamento do certificado.")
      return
    }
    if (tipo === "autorizacao_nr" && !responsavelNome) {
      toast.warning("Informe o nome do responsável pela emissão.")
      return
    }

    const ids = Array.from(selecionados)
    const body = tipo === "autorizacao_nr"
      ? {
          tipo,
          nr,
          empresa_id: empresaId,
          colaborador_ids: ids,
          registrar,
          responsavel_nome: responsavelNome,
          responsavel_cargo: responsavelCargo,
        }
      : {
          tipo,
          treinamento_id: treinamentoId,
          colaborador_ids: ids,
        }

    startTransition(async () => {
      try {
        const res = await fetch("/api/jobs/documentos-lote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Erro desconhecido" }))
          toast.error(data.error || "Falha ao enfileirar job")
          return
        }
        toast.success(`Job na fila — ${ids.length} colaborador(es)`, {
          description: "Você será redirecionado para acompanhar o progresso.",
        })
        router.push("/jobs")
      } catch (err) {
        toast.error("Erro de rede", {
          description: err instanceof Error ? err.message : String(err),
        })
      }
    })
  }

  const total = selecionados.size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-7 w-7" />
            Geração em lote
          </h1>
          <p className="text-muted-foreground">
            Selecione até {MAX_LOTE} colaboradores e gere PDFs em um único ZIP.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documentos"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Tipo de documento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className={`rounded-md border p-3 cursor-pointer transition-colors ${tipo === "autorizacao_nr" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-accent"}`}>
            <input type="radio" name="tipo" value="autorizacao_nr" checked={tipo === "autorizacao_nr"} onChange={() => setTipo("autorizacao_nr")} className="sr-only" />
            <div className="font-medium">Autorização NR</div>
            <div className="text-xs text-muted-foreground mt-1">
              NR-10 (eletricidade), NR-35 (altura), NR-33 (espaço confinado). Valida ASO e treinamento antes de emitir.
            </div>
          </label>
          <label className={`rounded-md border p-3 cursor-pointer transition-colors ${tipo === "certificado" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-accent"}`}>
            <input type="radio" name="tipo" value="certificado" checked={tipo === "certificado"} onChange={() => setTipo("certificado")} className="sr-only" />
            <div className="font-medium">Certificado de treinamento</div>
            <div className="text-xs text-muted-foreground mt-1">
              Frente/verso A4 paisagem. Gera só para colaboradores com realização do treinamento selecionado.
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Configuração</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {tipo === "autorizacao_nr" ? (
            <>
              <div className="space-y-2">
                <Label>NR *</Label>
                <Select value={nr} onValueChange={(v) => setNr(v as typeof nr)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NR-10">NR-10 — Eletricidade</SelectItem>
                    <SelectItem value="NR-35">NR-35 — Trabalho em altura</SelectItem>
                    <SelectItem value="NR-33">NR-33 — Espaço confinado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Empresa emissora *</Label>
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome do responsável *</Label>
                <Input value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} placeholder="Ex: Maria Silva" />
              </div>
              <div className="space-y-2">
                <Label>Cargo do responsável *</Label>
                <Input value={responsavelCargo} onChange={(e) => setResponsavelCargo(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex items-center space-x-2 pt-2">
                <input type="checkbox" id="registrar" checked={registrar} onChange={(e) => setRegistrar(e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="registrar" className="cursor-pointer">Registrar documentos emitidos em /documentos (recomendado)</Label>
              </div>
            </>
          ) : (
            <div className="md:col-span-2 space-y-2">
              <Label>Treinamento *</Label>
              <Select value={treinamentoId} onValueChange={setTreinamentoId}>
                <SelectTrigger><SelectValue placeholder="Escolha o treinamento" /></SelectTrigger>
                <SelectContent>
                  {treinamentos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.titulo}{t.nr_referencia ? ` — ${t.nr_referencia}` : ""} ({t.carga_horaria_horas}h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Será gerado 1 certificado por colaborador que tem realização deste treinamento.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                3. Colaboradores
              </CardTitle>
              <CardDescription>
                {total} selecionado(s) de {colaboradoresFiltrados.length} visíveis · máximo {MAX_LOTE}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllVisible} disabled={total >= MAX_LOTE}>
                Selecionar visíveis
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={total === 0}>
                Limpar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." className="pl-8" />
            </div>
            <Select value={filtroCargo || "__todos__"} onValueChange={(v) => setFiltroCargo(v === "__todos__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todos os cargos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__todos__">Todos os cargos</SelectItem>
                {cargosUnicos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroEmpresa || "__todas__"} onValueChange={(v) => setFiltroEmpresa(v === "__todas__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todas as empresas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__todas__">Todas as empresas</SelectItem>
                {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border max-h-96 overflow-y-auto">
            {colaboradoresFiltrados.map((c) => {
              const checked = selecionados.has(c.id)
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 px-3 py-2 border-b last:border-b-0 cursor-pointer transition-colors ${checked ? "bg-primary/5" : "hover:bg-accent"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.nome_completo}</div>
                    <div className="text-xs text-muted-foreground">
                      CPF {formatCPF(c.cpf)}{c.cargo_titulo ? ` · ${c.cargo_titulo}` : ""}
                    </div>
                  </div>
                </label>
              )
            })}
            {colaboradoresFiltrados.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum colaborador corresponde aos filtros.
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="flex flex-wrap gap-1">
              {Array.from(selecionados).slice(0, 20).map((id) => {
                const c = colaboradores.find((x) => x.id === id)
                return c ? (
                  <Badge key={id} variant="secondary" className="font-normal">
                    {c.nome_completo}
                  </Badge>
                ) : null
              })}
              {total > 20 && <Badge variant="outline">+{total - 20} mais</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-status-alerta">
        <CardContent className="flex items-start gap-3 py-4 text-sm">
          <AlertTriangle className="h-5 w-5 text-status-alerta shrink-0 mt-0.5" />
          <div>
            {tipo === "autorizacao_nr" ? (
              <>
                <p className="font-medium">O sistema valida automaticamente cada colaborador antes de emitir</p>
                <p className="text-muted-foreground mt-1">
                  Só é gerado PDF para quem tem ASO vigente (apto) <strong>e</strong> treinamento <strong>{nr}</strong> vigente.
                  Os demais são listados em <code>_relatorio.txt</code> dentro do ZIP, com o motivo de cada exclusão.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Certificado é gerado apenas para colaboradores com realização do treinamento</p>
                <p className="text-muted-foreground mt-1">
                  Se um colaborador selecionado não tem realização registrada, ele é pulado e listado em <code>_relatorio.txt</code>.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t -mx-6 px-6 flex-wrap">
        <Button type="button" variant="outline" asChild>
          <Link href="/documentos">Cancelar</Link>
        </Button>
        <Button type="button" variant="outline" onClick={handleGerarAsync} disabled={pending || total === 0}>
          {pending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Enfileirando...</>
            : <><ListTodo className="h-4 w-4" />Enviar para fila (recomendado, lotes grandes)</>
          }
        </Button>
        <Button type="button" onClick={handleGerar} disabled={pending || total === 0}>
          {pending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Gerando...</>
            : <><FileArchive className="h-4 w-4" />Gerar ZIP agora ({total})</>
          }
        </Button>
      </div>

      {pending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md border bg-muted/30">
          <CheckCircle2 className="h-4 w-4" />
          Gerando PDFs um por um. Pode demorar ~2-3 segundos por colaborador para lotes grandes.
        </div>
      )}
    </div>
  )
}

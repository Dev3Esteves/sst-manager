"use client"

import Link from "next/link"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
import { useState, useTransition, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignatureCanvas } from "@/components/signature-canvas"
import { Loader2, Plus, Trash2, Search, CheckCircle2, PenLine, UserPlus, MessageSquare, Settings2, ListChecks } from "lucide-react"
import { TEMAS_SUGERIDOS, type DdsInput, type DdsParticipante } from "@/lib/validations/dds"

type Empresa = { id: string; razao_social: string }
type Colaborador = {
  id: string
  nome_completo: string
  cpf: string
  empresa_id: string
  cargo_titulo: string | null
}
type Mediador = { id: string; nome: string; cargo: string | null }
type ParticipanteLocal = DdsParticipante & { id: string } // ID local para key/tracking

const MEDIADOR_MANUAL = "__manual__"

export function DDSForm({
  empresas, colaboradores, temas = [], mediadores = [], action,
}: {
  empresas: Empresa[]
  colaboradores: Colaborador[]
  temas?: string[]
  mediadores?: Mediador[]
  action: (payload: DdsInput) => Promise<{ ok: false; error: string } | void>
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "")
  const [tema, setTema] = useState("")
  const [dataDds, setDataDds] = useState(hojeBrasilia())
  const [horaInicio, setHoraInicio] = useState("07:30")
  const [duracao, setDuracao] = useState(15)
  const [local, setLocal] = useState("")
  const [mediadorNome, setMediadorNome] = useState("")
  const [mediadorCargo, setMediadorCargo] = useState("")
  const [topicosRaw, setTopicosRaw] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [assinaturaMed, setAssinaturaMed] = useState<string | null>(null)

  const [busca, setBusca] = useState("")
  const [participantes, setParticipantes] = useState<ParticipanteLocal[]>([])
  const [assinandoId, setAssinandoId] = useState<string | null>(null)

  const colabSelecionadosIds = useMemo(
    () => new Set(participantes.filter((p) => p.colaborador_id).map((p) => p.colaborador_id!)),
    [participantes],
  )

  const colaboradoresFiltrados = useMemo(() => {
    return colaboradores.filter((c) => {
      if (colabSelecionadosIds.has(c.id)) return false
      if (busca && !c.nome_completo.toLowerCase().includes(busca.toLowerCase())) return false
      return true
    })
  }, [colaboradores, busca, colabSelecionadosIds])

  // Temas: cadastrados (empresa) primeiro, depois sugestões padrão, sem duplicar
  const temasOpcoes = useMemo(() => {
    const vistos = new Set<string>()
    const out: string[] = []
    for (const t of [...temas, ...TEMAS_SUGERIDOS]) {
      const k = t.trim().toLowerCase()
      if (t.trim() && !vistos.has(k)) { vistos.add(k); out.push(t.trim()) }
    }
    return out
  }, [temas])

  function adicionarColaborador(c: Colaborador) {
    setParticipantes((prev) => [...prev, {
      id: crypto.randomUUID(),
      colaborador_id: c.id,
      nome: c.nome_completo,
      cpf: c.cpf,
      cargo: c.cargo_titulo,
      assinatura_data_url: null,
    }])
  }

  function adicionarTodos() {
    const novos = colaboradoresFiltrados.map((c) => ({
      id: crypto.randomUUID(),
      colaborador_id: c.id,
      nome: c.nome_completo,
      cpf: c.cpf,
      cargo: c.cargo_titulo,
      assinatura_data_url: null,
    }))
    if (novos.length > 0) setParticipantes((prev) => [...prev, ...novos])
  }

  function selecionarMediador(id: string) {
    if (id === MEDIADOR_MANUAL) return
    const m = mediadores.find((x) => x.id === id)
    if (m) {
      setMediadorNome(m.nome)
      if (m.cargo) setMediadorCargo(m.cargo)
    }
  }

  function adicionarAvulso() {
    setParticipantes((prev) => [...prev, {
      id: crypto.randomUUID(),
      colaborador_id: null,
      nome: "",
      cpf: null,
      cargo: null,
      assinatura_data_url: null,
    }])
  }

  function removerParticipante(id: string) {
    setParticipantes((prev) => prev.filter((p) => p.id !== id))
    if (assinandoId === id) setAssinandoId(null)
  }

  function atualizarParticipante(id: string, patch: Partial<ParticipanteLocal>) {
    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function confirmarAssinatura(id: string, dataUrl: string | null | undefined) {
    atualizarParticipante(id, { assinatura_data_url: dataUrl })
    setAssinandoId(null)
  }

  function handleSubmit() {
    setError(null)
    const topicos = topicosRaw.split("\n").map((l) => l.trim()).filter(Boolean)

    if (!mediadorNome) { setError("Informe o nome do mediador"); return }
    if (participantes.length === 0) { setError("Adicione ao menos 1 participante"); return }
    if (participantes.some((p) => !p.nome)) { setError("Há participante sem nome"); return }
    const semAssinatura = participantes.filter((p) => !p.assinatura_data_url).length
    if (semAssinatura > 0) {
      if (!confirm(`${semAssinatura} participante(s) sem assinatura. Salvar mesmo assim?`)) return
    }

    const payload: DdsInput = {
      empresa_id: empresaId,
      tema,
      data_dds: dataDds,
      hora_inicio: horaInicio || null,
      duracao_minutos: duracao,
      local,
      mediador_nome: mediadorNome,
      mediador_cargo: mediadorCargo || null,
      topicos,
      observacoes: observacoes || null,
      participantes: participantes.map((p) => ({
        colaborador_id: p.colaborador_id,
        nome: p.nome,
        cpf: p.cpf,
        cargo: p.cargo,
        assinatura_data_url: p.assinatura_data_url,
      })),
      assinatura_mediador_data_url: assinaturaMed,
    }

    startTransition(async () => {
      const result = await action(payload)
      if (result && "error" in result) {
        setError(result.error)
      }
      // Se ok, action redireciona
    })
  }

  const totalAssinados = participantes.filter((p) => p.assinatura_data_url).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-7 w-7" />
          Novo DDS
        </h1>
        <p className="text-muted-foreground">
          Passe o dispositivo entre os participantes para que cada um assine. O mediador assina por último.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">1. Identificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger id="empresa"><SelectValue /></SelectTrigger>
              <SelectContent>
                {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local *</Label>
            <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Data Center ABC — Sala 3" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tema">Tema *</Label>
              <Link href="/dds-catalogo" target="_blank" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                <Settings2 className="h-3 w-3" /> Gerenciar catálogo
              </Link>
            </div>
            <Input id="tema" value={tema} onChange={(e) => setTema(e.target.value)} list="temas-sugeridos" placeholder="Ex: NR-10 — Riscos em trabalho com eletricidade" />
            <datalist id="temas-sugeridos">
              {temasOpcoes.map((t) => <option key={t} value={t} />)}
            </datalist>
            <p className="text-xs text-muted-foreground">Comece a digitar para ver os temas cadastrados e sugestões.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_dds">Data *</Label>
            <Input id="data_dds" type="date" value={dataDds} onChange={(e) => setDataDds(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora</Label>
              <Input id="hora_inicio" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (min)</Label>
              <Input id="duracao" type="number" min="1" max="240" value={duracao} onChange={(e) => setDuracao(+e.target.value)} />
            </div>
          </div>
          {mediadores.length > 0 && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mediador-cadastrado">Mediador cadastrado</Label>
              <Select value={MEDIADOR_MANUAL} onValueChange={selecionarMediador}>
                <SelectTrigger id="mediador-cadastrado"><SelectValue placeholder="Selecione para preencher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={MEDIADOR_MANUAL}>— Preencher manualmente —</SelectItem>
                  {mediadores.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}{m.cargo ? ` — ${m.cargo}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="mediador_nome">Mediador (nome) *</Label>
            <Input id="mediador_nome" value={mediadorNome} onChange={(e) => setMediadorNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mediador_cargo">Mediador (cargo)</Label>
            <Input id="mediador_cargo" value={mediadorCargo} onChange={(e) => setMediadorCargo(e.target.value)} placeholder="Ex: Técnico de Segurança" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Tópicos abordados</CardTitle>
          <CardDescription>Uma linha por tópico. Lista aparece no PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={topicosRaw} onChange={(e) => setTopicosRaw(e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={"Uso obrigatório do cinto tipo paraquedista acima de 2m\nVerificação dos pontos de ancoragem antes de iniciar\nIsolamento e sinalização da área de projeção"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">3. Participantes</CardTitle>
            <CardDescription>
              {participantes.length} adicionado(s) · {totalAssinados} assinatura(s) coletada(s)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={adicionarTodos} disabled={colaboradoresFiltrados.length === 0}>
              <ListChecks className="h-4 w-4" />
              Selecionar todos{busca ? " (filtrados)" : ""}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={adicionarAvulso}>
              <UserPlus className="h-4 w-4" />
              Avulso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca de colaboradores cadastrados */}
          <div className="space-y-2">
            <Label>Adicionar colaborador cadastrado</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca} onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome..."
                className="pl-8"
              />
            </div>
            {busca && (
              <div className="rounded-md border max-h-48 overflow-y-auto">
                {colaboradoresFiltrados.slice(0, 20).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { adicionarColaborador(c); setBusca("") }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-accent text-left"
                  >
                    <div>
                      <div className="text-sm font-medium">{c.nome_completo}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.cpf}{c.cargo_titulo ? ` · ${c.cargo_titulo}` : ""}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))}
                {colaboradoresFiltrados.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground text-center">
                    Nenhum colaborador disponível.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lista de participantes */}
          {participantes.length > 0 && (
            <div className="rounded-md border divide-y">
              {participantes.map((p, i) => {
                const assinando = assinandoId === p.id
                return (
                  <div key={p.id} className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {p.colaborador_id ? (
                          <div>
                            <div className="text-sm font-medium">{p.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.cpf ?? "—"}{p.cargo ? ` · ${p.cargo}` : ""}
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2 md:grid-cols-3">
                            <Input
                              value={p.nome}
                              onChange={(e) => atualizarParticipante(p.id, { nome: e.target.value })}
                              placeholder="Nome *"
                              className="h-8"
                            />
                            <Input
                              value={p.cpf ?? ""}
                              onChange={(e) => atualizarParticipante(p.id, { cpf: e.target.value })}
                              placeholder="CPF"
                              className="h-8"
                            />
                            <Input
                              value={p.cargo ?? ""}
                              onChange={(e) => atualizarParticipante(p.id, { cargo: e.target.value })}
                              placeholder="Cargo"
                              className="h-8"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.assinatura_data_url ? (
                          <Badge variant="regular" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Assinado
                          </Badge>
                        ) : (
                          <Button
                            type="button" variant="outline" size="sm"
                            onClick={() => setAssinandoId(assinando ? null : p.id)}
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            {assinando ? "Fechar" : "Assinar"}
                          </Button>
                        )}
                        <Button
                          type="button" variant="ghost" size="icon"
                          onClick={() => removerParticipante(p.id)}
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {assinando && (
                      <div className="pl-8 pt-2 border-t">
                        <SignatureCanvas
                          onChange={(dataUrl) => {
                            if (dataUrl) atualizarParticipante(p.id, { assinatura_data_url: dataUrl })
                          }}
                          label={`Assinatura de ${p.nome || "participante"}`}
                          height={140}
                          width={400}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button" size="sm"
                            onClick={() => confirmarAssinatura(p.id, p.assinatura_data_url)}
                            disabled={!p.assinatura_data_url}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmar e próximo
                          </Button>
                        </div>
                      </div>
                    )}
                    {p.assinatura_data_url && !assinando && (
                      <div className="pl-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.assinatura_data_url}
                          alt="Assinatura"
                          className="h-10 rounded border bg-white"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {participantes.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum participante ainda. Busque um colaborador acima ou adicione um avulso.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">4. Observações (opcional)</CardTitle></CardHeader>
        <CardContent>
          <textarea
            value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Conclusões, ações recomendadas, questões levantadas..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Assinatura do mediador</CardTitle>
          <CardDescription>Assinatura do responsável que conduziu o DDS.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignatureCanvas onChange={setAssinaturaMed} label={`Assinatura do mediador${mediadorNome ? ` — ${mediadorNome}` : ""}`} />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t -mx-6 px-6">
        <Button type="button" variant="outline" asChild>
          <Link href="/dds">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !tema || !local || !mediadorNome}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Finalizar DDS
        </Button>
      </div>
    </div>
  )
}

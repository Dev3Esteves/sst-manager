"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, AlertTriangle, Lightbulb } from "lucide-react"
import { OCORRENCIA_TIPOS, GRAVIDADE_LABEL, type OcorrenciaInput, type TemplateOcorrenciaInit } from "@/lib/validations/ocorrencia"
import { BodyRegionSelector, regioesToString, type RegiaoCorpo } from "@/components/body-region-selector"
import { agoraBrasiliaInput } from "@/lib/utils/data-brasilia"

type Empresa = { id: string; razao_social: string }
type Colaborador = { id: string; nome_completo: string }
type ObraLocal = { id: string; nome: string; obra_nome: string }
type FormErrors = { _form?: string[] }

type OcorrenciaExistente = {
  id: string
  empresa_id: string
  tipo: string
  data_ocorrencia: string
  local: string
  descricao: string
  colaborador_id: string | null
  gravidade: string | null
  parte_corpo_atingida: string | null
  regioes_corpo?: string[] | null
  natureza_lesao: string | null
  agente_causador: string | null
  dias_afastamento: number | null
  obra_local_id?: string | null
}

const SEM_LOCAL = "__sem_local__"

export function OcorrenciaForm({
  empresas, colaboradores, action, ocorrencia, templateInit, obraLocais = [],
}: {
  empresas: Empresa[]
  colaboradores: Colaborador[]
  action: (payload: OcorrenciaInput) => Promise<{ error?: FormErrors } | void>
  ocorrencia?: OcorrenciaExistente
  templateInit?: TemplateOcorrenciaInit
  obraLocais?: ObraLocal[]
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [empresaId, setEmpresaId] = useState(ocorrencia?.empresa_id ?? empresas[0]?.id ?? "")
  const [tipo, setTipo] = useState<string>(ocorrencia?.tipo ?? templateInit?.tipo ?? "quase_acidente")
  const [colabId, setColabId] = useState(ocorrencia?.colaborador_id ?? "")
  const [gravidade, setGravidade] = useState<string>(ocorrencia?.gravidade ?? templateInit?.gravidade_sugerida ?? "")
  const [data, setData] = useState(ocorrencia ? ocorrencia.data_ocorrencia.slice(0, 16) : agoraBrasiliaInput())
  const [local, setLocal] = useState(ocorrencia?.local ?? "")
  const [obraLocalId, setObraLocalId] = useState(ocorrencia?.obra_local_id ?? "")
  const [descricao, setDescricao] = useState(ocorrencia?.descricao ?? templateInit?.descricao_modelo ?? "")

  function selecionarObraLocal(id: string) {
    if (id === SEM_LOCAL) { setObraLocalId(""); return }
    setObraLocalId(id)
    const ol = obraLocais.find((o) => o.id === id)
    if (ol) setLocal(`${ol.obra_nome} — ${ol.nome}`)
  }
  const [regioesAtingidas, setRegioesAtingidas] = useState<RegiaoCorpo[]>(
    (ocorrencia?.regioes_corpo as RegiaoCorpo[] | undefined) ?? [],
  )
  const [parteCorpoAtingida, setParteCorpoAtingida] = useState(ocorrencia?.parte_corpo_atingida ?? "")
  const [naturezaLesao, setNaturezaLesao] = useState(ocorrencia?.natureza_lesao ?? templateInit?.natureza_lesao_sugerida ?? "")
  const [agenteCausador, setAgenteCausador] = useState(ocorrencia?.agente_causador ?? templateInit?.agente_causador_sugerido ?? "")
  const [diasAfastamento, setDiasAfastamento] = useState(ocorrencia?.dias_afastamento?.toString() ?? "")

  const ehAcidente = ["acidente_tipico", "acidente_trajeto", "doenca_ocupacional"].includes(tipo)

  function handleSubmit() {
    // Combina regiões selecionadas visualmente + texto livre (se houver)
    const partesTextuais: string[] = []
    if (regioesAtingidas.length > 0) partesTextuais.push(regioesToString(regioesAtingidas))
    if (parteCorpoAtingida.trim()) partesTextuais.push(parteCorpoAtingida.trim())
    const parteCorpoFinal = partesTextuais.length > 0 ? partesTextuais.join(" — ") : null

    const payload: OcorrenciaInput = {
      empresa_id: empresaId,
      tipo: tipo as OcorrenciaInput["tipo"],
      data_ocorrencia: new Date(data).toISOString(),
      local,
      descricao,
      colaborador_id: colabId || null,
      gravidade: (gravidade as OcorrenciaInput["gravidade"]) || null,
      parte_corpo_atingida: parteCorpoFinal,
      regioes_corpo: regioesAtingidas.length > 0 ? regioesAtingidas : null,
      natureza_lesao: naturezaLesao || null,
      agente_causador: agenteCausador || null,
      obra_local_id: obraLocalId || null,
      dias_afastamento: diasAfastamento ? parseInt(diasAfastamento, 10) : null,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ocorrencia ? "Editar ocorrência" : "Registrar ocorrência"}</h1>
        <p className="text-muted-foreground">{ocorrencia ? "Atualize os dados da ocorrência." : "Após salvar, você poderá fazer a investigação guiada (5 Porquês)."}</p>
      </div>

      {templateInit?.roteiro_investigacao && templateInit.roteiro_investigacao.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Roteiro de investigação sugerido
            </CardTitle>
            <CardDescription>Use estas perguntas-guia ao investigar a causa-raiz (5 Porquês) após salvar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
              {templateInit.roteiro_investigacao.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">1. Classificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(OCORRENCIA_TIPOS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gravidade</Label>
            <Select value={gravidade} onValueChange={setGravidade}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {Object.entries(GRAVIDADE_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Colaborador envolvido</Label>
            <Select value={colabId} onValueChange={setColabId}>
              <SelectTrigger><SelectValue placeholder="Sem envolvido identificado" /></SelectTrigger>
              <SelectContent>
                {colaboradores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">2. Ocorrência</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dt">Data e hora *</Label>
            <Input id="dt" type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} />
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
            <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Subestação Sala 3" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="desc">Descrição do ocorrido *</Label>
            <textarea
              id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="O que aconteceu? Onde? Como? Quem estava presente?"
            />
          </div>
        </CardContent>
      </Card>

      {ehAcidente && (
        <Card className="border-status-alerta">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-alerta" />
              3. Detalhes do acidente
            </CardTitle>
            <CardDescription>Necessário para emissão da CAT (eSocial S-2210).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Regiões atingidas</Label>
              <p className="text-xs text-muted-foreground">
                Clique nos locais do corpo que foram atingidos (frente e/ou verso). Você pode marcar várias regiões.
              </p>
              <BodyRegionSelector value={regioesAtingidas} onChange={setRegioesAtingidas} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pc">Detalhamento adicional (opcional)</Label>
              <Input
                id="pc" value={parteCorpoAtingida} onChange={(e) => setParteCorpoAtingida(e.target.value)}
                placeholder="Ex: corte no dedo indicador direito, região do polegar..."
              />
              <p className="text-xs text-muted-foreground">
                Use para precisar mais do que o diagrama permite (ex: qual dedo, quadrante do olho).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl">Natureza da lesão</Label>
              <Input id="nl" value={naturezaLesao} onChange={(e) => setNaturezaLesao(e.target.value)} placeholder="Ex: corte, queimadura, fratura" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac">Agente causador</Label>
              <Input id="ac" value={agenteCausador} onChange={(e) => setAgenteCausador(e.target.value)} placeholder="Ex: ferramenta manual, choque elétrico" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="da">Dias de afastamento</Label>
              <Input id="da" type="number" min="0" value={diasAfastamento} onChange={(e) => setDiasAfastamento(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/ocorrencias">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !local || !descricao}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {ocorrencia ? "Salvar" : "Registrar"}
        </Button>
      </div>
    </div>
  )
}

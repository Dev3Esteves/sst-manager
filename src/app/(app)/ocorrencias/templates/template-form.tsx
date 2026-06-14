"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Plus, Trash2, RotateCcw } from "lucide-react"
import { OCORRENCIA_TIPOS, GRAVIDADE_LABEL, type TemplateOcorrenciaInput } from "@/lib/validations/ocorrencia"
import { reverterTemplateOcorrencia } from "./actions"

type FormErrors = { _form?: string[] }

export function TemplateOcorrenciaForm({
  template,
  action,
}: {
  template?: {
    id: string
    tipo: string
    titulo: string
    descricao_modelo: string | null
    gravidade_sugerida: string | null
    natureza_lesao_sugerida: string | null
    agente_causador_sugerido: string | null
    roteiro_investigacao: string[] | null
    is_sistema: boolean
  }
  action: (payload: TemplateOcorrenciaInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [reverting, startRevert] = useTransition()
  const [tipo, setTipo] = useState(template?.tipo ?? "quase_acidente")
  const [titulo, setTitulo] = useState(template?.titulo ?? "")
  const [descricao, setDescricao] = useState(template?.descricao_modelo ?? "")
  const [gravidade, setGravidade] = useState(template?.gravidade_sugerida ?? "")
  const [natureza, setNatureza] = useState(template?.natureza_lesao_sugerida ?? "")
  const [agente, setAgente] = useState(template?.agente_causador_sugerido ?? "")
  const [roteiro, setRoteiro] = useState<string[]>(template?.roteiro_investigacao ?? [""])

  function updateRoteiro(i: number, v: string) {
    setRoteiro((prev) => prev.map((q, idx) => (idx === i ? v : q)))
  }
  function addRoteiro() {
    setRoteiro((prev) => [...prev, ""])
  }
  function removeRoteiro(i: number) {
    setRoteiro((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit() {
    const payload: TemplateOcorrenciaInput = {
      tipo: tipo as TemplateOcorrenciaInput["tipo"],
      titulo,
      descricao_modelo: descricao.trim() || null,
      gravidade_sugerida: (gravidade as TemplateOcorrenciaInput["gravidade_sugerida"]) || null,
      natureza_lesao_sugerida: natureza.trim() || null,
      agente_causador_sugerido: agente.trim() || null,
      roteiro_investigacao: roteiro.map((q) => q.trim()).filter(Boolean),
      ativo: true,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  function handleReverter() {
    if (!template) return
    startRevert(async () => {
      const result = await reverterTemplateOcorrencia(template.id)
      if (result?.error) setErrors(result.error)
      else window.location.reload()
    })
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {template ? "Editar template de ocorrência" : "Novo template de ocorrência"}
          </h1>
          <p className="text-muted-foreground">
            Pré-configura o formulário de registro de ocorrências (roteiro de descrição e investigação).
          </p>
        </div>
        {template?.is_sistema && (
          <Button type="button" variant="outline" onClick={handleReverter} disabled={reverting}>
            {reverting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Reverter ao padrão
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tpl-tipo">Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tpl-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(OCORRENCIA_TIPOS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tit">Título *</Label>
            <Input id="tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Quase acidente" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-gravidade">Gravidade sugerida</Label>
            <Select value={gravidade} onValueChange={setGravidade}>
              <SelectTrigger id="tpl-gravidade"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>
                {Object.entries(GRAVIDADE_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roteiro de descrição</CardTitle>
          <CardDescription>Preenche o campo &quot;Descrição&quot; ao iniciar a ocorrência (o usuário completa).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={8}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            placeholder={"DESCRIÇÃO\n• O que aconteceu:\n• Onde / quando:\n• ..."}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nl">Natureza da lesão sugerida</Label>
              <Input id="nl" value={natureza} onChange={(e) => setNatureza(e.target.value)} placeholder="Ex: corte, contusão" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac">Agente causador sugerido</Label>
              <Input id="ac" value={agente} onChange={(e) => setAgente(e.target.value)} placeholder="Ex: ferramenta manual" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roteiro de investigação (5 Porquês)</CardTitle>
          <CardDescription>Perguntas-guia exibidas como apoio na investigação da causa-raiz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {roteiro.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
              <Input value={q} onChange={(e) => updateRoteiro(i, e.target.value)} placeholder={`Pergunta ${i + 1}`} />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeRoteiro(i)} className="text-destructive shrink-0" aria-label="Remover pergunta">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addRoteiro}>
            <Plus className="h-4 w-4" /> Adicionar pergunta
          </Button>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/ocorrencias/templates">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !titulo.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {template ? "Salvar alterações" : "Criar template"}
        </Button>
      </div>
    </div>
  )
}

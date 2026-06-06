"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react"
import { PERIODICIDADES, type TemplateInspecaoInput, type TemplateItem } from "@/lib/validations/inspecao"

type FormErrors = { _form?: string[] }

type ItemRow = {
  grupo: string
  pergunta: string
  nr_referencia: string
  foto_obrigatoria: boolean
}

function toRows(itens: TemplateItem[]): ItemRow[] {
  return itens.map((it) => ({
    grupo: it.grupo ?? "",
    pergunta: it.pergunta,
    nr_referencia: it.nr_referencia ?? "",
    foto_obrigatoria: !!it.foto_obrigatoria,
  }))
}

export function TemplateInspecaoForm({
  template,
  action,
}: {
  template?: {
    id: string
    titulo: string
    categoria: string | null
    periodicidade: string | null
    ativo: boolean
    itens: TemplateItem[]
  }
  action: (payload: TemplateInspecaoInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState(template?.titulo ?? "")
  const [categoria, setCategoria] = useState(template?.categoria ?? "")
  const [periodicidade, setPeriodicidade] = useState(template?.periodicidade ?? "mensal")
  const [ativo, setAtivo] = useState(template?.ativo ?? true)
  const [rows, setRows] = useState<ItemRow[]>(
    template ? toRows(template.itens) : [{ grupo: "", pergunta: "", nr_referencia: "", foto_obrigatoria: false }]
  )

  function updateRow(i: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function addRow() {
    setRows((prev) => [...prev, { grupo: "", pergunta: "", nr_referencia: "", foto_obrigatoria: false }])
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i))
  }
  function moveRow(i: number, dir: -1 | 1) {
    setRows((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const copy = [...prev]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  function handleSubmit() {
    const itens: TemplateItem[] = rows
      .filter((r) => r.pergunta.trim())
      .map((r) => ({
        grupo: r.grupo.trim() || undefined,
        pergunta: r.pergunta.trim(),
        tipo_resposta: "sim_nao_na",
        nr_referencia: r.nr_referencia.trim() || undefined,
        foto_obrigatoria: r.foto_obrigatoria || undefined,
      }))

    const payload: TemplateInspecaoInput = {
      titulo,
      categoria: categoria.trim() || null,
      periodicidade: periodicidade || null,
      ativo,
      itens,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {template ? "Editar template de inspeção" : "Novo template de inspeção"}
        </h1>
        <p className="text-muted-foreground">
          Checklist reutilizável. Cada item usa resposta Conforme / Não conforme / N/A.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tit">Título *</Label>
            <Input id="tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Inspeção de Andaimes" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat">Categoria</Label>
            <Input id="cat" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: trabalho em altura" />
          </div>
          <div className="space-y-2">
            <Label>Periodicidade</Label>
            <Select value={periodicidade} onValueChange={setPeriodicidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PERIODICIDADES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4" />
            Template ativo (disponível ao iniciar inspeções)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens do checklist</CardTitle>
          <CardDescription>{rows.length} item(ns). Use o agrupamento para organizar (ex: &quot;Documentação&quot;, &quot;Proteção&quot;).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GripVertical className="h-4 w-4" /> Item {i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveRow(i, -1)} disabled={i === 0} title="Subir">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1} title="Descer">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)} title="Remover" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Grupo</Label>
                  <Input value={r.grupo} onChange={(e) => updateRow(i, { grupo: e.target.value })} placeholder="Ex: Documentação" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">NR de referência</Label>
                  <Input value={r.nr_referencia} onChange={(e) => updateRow(i, { nr_referencia: e.target.value })} placeholder="Ex: NR-35" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Pergunta *</Label>
                  <Input value={r.pergunta} onChange={(e) => updateRow(i, { pergunta: e.target.value })} placeholder="O que deve ser verificado?" />
                </div>
                <label className="flex items-center gap-2 text-sm md:col-span-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r.foto_obrigatoria}
                    onChange={(e) => updateRow(i, { foto_obrigatoria: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Exigir foto quando &quot;Não conforme&quot;
                </label>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addRow} className="w-full">
            <Plus className="h-4 w-4" /> Adicionar item
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
          <Link href="/inspecoes/templates">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !titulo.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {template ? "Salvar alterações" : "Criar template"}
        </Button>
      </div>
    </div>
  )
}

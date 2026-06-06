"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ShieldCheck } from "lucide-react"
import { COMPROMISSOS_52, type PoliticaInput } from "@/lib/validations/politica"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"

type FormErrors = { _form?: string[] }

type PoliticaExistente = {
  id: string
  titulo: string
  conteudo: string
  compromisso_condicoes_seguras: boolean
  compromisso_requisitos_legais: boolean
  compromisso_eliminar_riscos: boolean
  compromisso_melhoria_continua: boolean
  compromisso_participacao: boolean
  aprovado_por_nome: string | null
  aprovado_por_cargo: string | null
  data_aprovacao: string | null
  publica: boolean
}

const MODELO = `A [EMPRESA] estabelece esta Política de Segurança e Saúde no Trabalho e assume o compromisso de:
- prover condições de trabalho seguras e saudáveis, prevenindo lesões e doenças relacionadas ao trabalho;
- cumprir os requisitos legais (Normas Regulamentadoras) e demais requisitos aplicáveis;
- eliminar perigos e reduzir os riscos de SST;
- melhorar continuamente o sistema de gestão e o desempenho de SST;
- assegurar a consulta e a participação dos trabalhadores.

Esta política orienta a definição dos objetivos de SST e é comunicada a todos os trabalhadores e partes interessadas.`

export function PoliticaForm({
  politica,
  action,
}: {
  politica?: PoliticaExistente
  action: (payload: PoliticaInput) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState(politica?.titulo ?? "Política de Segurança e Saúde no Trabalho")
  const [conteudo, setConteudo] = useState(politica?.conteudo ?? MODELO)
  const [comp, setComp] = useState({
    compromisso_condicoes_seguras: politica?.compromisso_condicoes_seguras ?? true,
    compromisso_requisitos_legais: politica?.compromisso_requisitos_legais ?? true,
    compromisso_eliminar_riscos: politica?.compromisso_eliminar_riscos ?? true,
    compromisso_melhoria_continua: politica?.compromisso_melhoria_continua ?? true,
    compromisso_participacao: politica?.compromisso_participacao ?? true,
  })
  const [aprovadoNome, setAprovadoNome] = useState(politica?.aprovado_por_nome ?? "")
  const [aprovadoCargo, setAprovadoCargo] = useState(politica?.aprovado_por_cargo ?? "")
  const [dataAprovacao, setDataAprovacao] = useState(politica?.data_aprovacao?.slice(0, 10) ?? hojeBrasilia())
  const [publica, setPublica] = useState(politica?.publica ?? false)

  function handleSubmit() {
    const payload: PoliticaInput = {
      titulo,
      conteudo,
      ...comp,
      aprovado_por_nome: aprovadoNome || null,
      aprovado_por_cargo: aprovadoCargo || null,
      data_aprovacao: dataAprovacao || null,
      publica,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{politica ? "Editar política" : "Nova revisão da Política de SST"}</h1>
          <p className="text-muted-foreground">ISO 45001 — cláusula 5.2. Após salvar, publique para torná-la vigente.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Texto da política</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tit">Título *</Label>
            <Input id="tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cont">Declaração da política *</Label>
            <textarea
              id="cont" value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={12}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compromissos exigidos (cláusula 5.2)</CardTitle>
          <CardDescription>O auditor verifica que todos estão contemplados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {COMPROMISSOS_52.map((c) => (
            <label key={c.campo} className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={comp[c.campo as keyof typeof comp]}
                onChange={(e) => setComp((p) => ({ ...p, [c.campo]: e.target.checked }))}
                className="h-4 w-4 mt-0.5"
              />
              <span>{c.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Aprovação pela direção</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="an">Aprovado por (nome)</Label>
            <Input id="an" value={aprovadoNome} onChange={(e) => setAprovadoNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ac">Cargo</Label>
            <Input id="ac" value={aprovadoCargo} onChange={(e) => setAprovadoCargo(e.target.value)} placeholder="Ex: Diretor" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="da">Data de aprovação</Label>
            <Input id="da" type="date" value={dataAprovacao} onChange={(e) => setDataAprovacao(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-3 cursor-pointer">
            <input type="checkbox" checked={publica} onChange={(e) => setPublica(e.target.checked)} className="h-4 w-4" />
            Disponível a partes interessadas (publicada)
          </label>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors._form[0]}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/politica">Cancelar</Link></Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !titulo.trim() || conteudo.trim().length < 20}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {politica ? "Salvar alterações" : "Criar revisão"}
        </Button>
      </div>
    </div>
  )
}

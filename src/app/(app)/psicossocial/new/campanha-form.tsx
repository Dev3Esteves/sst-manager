"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { criarCampanha } from "../actions"
import { INSTRUMENTOS, getInstrumento, INSTRUMENTO_PADRAO, NATUREZA_LABEL } from "@/lib/psicossocial/instrumentos"
import { PERGUNTAS_QUALITATIVAS_PADRAO } from "@/lib/psicossocial/qualitativo"

export function CampanhaForm({ pgrs }: { pgrs: { id: string; label: string }[] }) {
  const [pgrId, setPgrId] = useState(pgrs[0]?.id ?? "")
  const [instrumentoKey, setInstrumentoKey] = useState(INSTRUMENTO_PADRAO)
  const instrInfo = getInstrumento(instrumentoKey)
  const versoesDisponiveis = instrInfo?.versoes ?? []
  const [versao, setVersao] = useState<string>(versoesDisponiveis[0]?.value ?? "curto")
  const [modoQualitativo, setModoQualitativo] = useState<"nenhum" | "integrado" | "separado">("nenhum")
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function trocarInstrumento(key: string) {
    setInstrumentoKey(key)
    setVersao(getInstrumento(key)?.versoes[0]?.value ?? "")
  }

  function handle(formData: FormData) {
    setErro(null)
    formData.set("pgr_id", pgrId)
    formData.set("instrumento_key", instrumentoKey)
    formData.set("versao_aplicada", versao)
    formData.set("modo_qualitativo", modoQualitativo)
    startTransition(async () => {
      const r = await criarCampanha(formData)
      if (r && "error" in r) setErro(r.error)
    })
  }

  return (
    <form action={handle}>
      <Card>
        <CardHeader>
          <CardTitle>Dados da campanha</CardTitle>
          <CardDescription>Um link/QR anônimo será gerado por GHE do PGR escolhido.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pgr_id">PGR (obra) *</Label>
            <Select value={pgrId} onValueChange={setPgrId}>
              <SelectTrigger id="pgr_id"><SelectValue placeholder="Selecione o PGR" /></SelectTrigger>
              <SelectContent>
                {pgrs.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" name="titulo" placeholder="Ex.: Avaliação psicossocial 2026 — Obra X" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instrumento">Instrumento *</Label>
            <Select value={instrumentoKey} onValueChange={trocarInstrumento}>
              <SelectTrigger id="instrumento"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INSTRUMENTOS.map((i) => <SelectItem key={i.key} value={i.key}>{i.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="versao">Versão do questionário *</Label>
            <Select value={versao} onValueChange={setVersao}>
              <SelectTrigger id="versao"><SelectValue /></SelectTrigger>
              <SelectContent>
                {versoesDisponiveis.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {instrInfo && (
            <div className="md:col-span-2 rounded-md border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{instrInfo.nome}</span>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
                  {NATUREZA_LABEL[instrInfo.natureza]}
                </span>
                {!instrInfo.oficial && (
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px]">
                    texto adaptado (não licenciado)
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{instrInfo.resumo}</p>
              <p className="text-xs text-muted-foreground">Fonte: {instrInfo.fonte}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="min_respondentes">Mín. respondentes / GHE</Label>
            <Input id="min_respondentes" name="min_respondentes" type="number" defaultValue={5} min={3} max={50} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_inicio">Data de início *</Label>
            <Input id="data_inicio" name="data_inicio" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_fim">Data de fim</Label>
            <Input id="data_fim" name="data_fim" type="date" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="modo_qualitativo">Pesquisa qualitativa (perguntas abertas)</Label>
            <Select value={modoQualitativo} onValueChange={(v) => setModoQualitativo(v as typeof modoQualitativo)}>
              <SelectTrigger id="modo_qualitativo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Não usar (somente questionário quantitativo)</SelectItem>
                <SelectItem value="integrado">Integrada — perguntas abertas antes do questionário</SelectItem>
                <SelectItem value="separado">Separada — campanha só com perguntas abertas</SelectItem>
              </SelectContent>
            </Select>
            {modoQualitativo !== "nenhum" && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Perguntas abertas (template padrão):</p>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                  {PERGUNTAS_QUALITATIVAS_PADRAO.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Respostas anônimas, com síntese por IA e supressão por grupo (k-anonimato).
                </p>
              </div>
            )}
          </div>

          {erro && <p className="text-sm text-destructive md:col-span-2" role="alert">{erro}</p>}
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" asChild><Link href="/psicossocial">Cancelar</Link></Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Criar campanha
        </Button>
      </div>
    </form>
  )
}

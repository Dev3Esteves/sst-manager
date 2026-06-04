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

export function CampanhaForm({ pgrs }: { pgrs: { id: string; label: string }[] }) {
  const [pgrId, setPgrId] = useState(pgrs[0]?.id ?? "")
  const [versao, setVersao] = useState<"curto" | "medio">("curto")
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handle(formData: FormData) {
    setErro(null)
    formData.set("pgr_id", pgrId)
    formData.set("versao_aplicada", versao)
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
            <Label>PGR (obra) *</Label>
            <Select value={pgrId} onValueChange={setPgrId}>
              <SelectTrigger><SelectValue placeholder="Selecione o PGR" /></SelectTrigger>
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
            <Label>Versão do questionário *</Label>
            <Select value={versao} onValueChange={(v) => setVersao(v as "curto" | "medio")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="curto">Curta (frentes de obra)</SelectItem>
                <SelectItem value="medio">Média (padrão)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

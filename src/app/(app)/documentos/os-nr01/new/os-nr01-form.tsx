"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, FileDown } from "lucide-react"

type CargoOpcao = {
  id: string
  titulo: string
  empresa_id: string
  descricao_atividades?: string | null
  riscos_associados?: unknown
  epis_obrigatorios?: unknown
  empresas?: { razao_social: string } | { razao_social: string }[]
}
type ObraOpcao = { id: string; nome: string; empresa_id: string }
type EmpresaOpcao = { id: string; razao_social: string }

/**
 * Emissão de OS NR-01 por função: usuário seleciona cargo + empresa + obra,
 * a API busca colaboradores da função naquela empresa e gera um ZIP com
 * uma OS por colaborador (usando os riscos/EPIs cadastrados no cargo).
 */
export function OsNr01Form({
  cargos, obras, empresas,
}: {
  cargos: CargoOpcao[]
  obras: ObraOpcao[]
  empresas: EmpresaOpcao[]
}) {
  const [empresaId, setEmpresaId] = useState<string>(empresas[0]?.id ?? "")
  const [cargoId, setCargoId] = useState<string>("")
  const [obraId, setObraId] = useState<string>("")
  const [numero, setNumero] = useState("")
  const [revisao, setRevisao] = useState("00")
  const [observacoes, setObservacoes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const cargosDaEmpresa = useMemo(
    () => cargos.filter((c) => c.empresa_id === empresaId),
    [cargos, empresaId],
  )
  const obrasDaEmpresa = useMemo(
    () => obras.filter((o) => o.empresa_id === empresaId),
    [obras, empresaId],
  )

  const cargoSelecionado = cargos.find((c) => c.id === cargoId)

  async function gerar() {
    setError(null)
    if (!cargoId || !empresaId || !obraId) {
      setError("Selecione empresa, função e obra.")
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/documentos/os-nr01/gerar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empresa_id: empresaId,
            cargo_id: cargoId,
            obra_id: obraId,
            numero: numero.trim() || undefined,
            revisao: revisao.trim() || "00",
            observacoes: observacoes.trim() || null,
          }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          setError(j.error ?? `Erro ao gerar: HTTP ${res.status}`)
          return
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `OS-NR01-${cargoSelecionado?.titulo?.replace(/\s+/g, "_") ?? "cargo"}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar OS</CardTitle>
        <CardDescription>
          A OS é emitida por função: todos os colaboradores da função selecionada, alocados
          na obra escolhida, recebem uma página da OS com sua identificação.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="empresa-dona">Empresa própria *</Label>
          <Select
            value={empresaId}
            onValueChange={(v) => {
              setEmpresaId(v)
              setCargoId("")
              setObraId("")
            }}
          >
            <SelectTrigger id="empresa-dona"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargo">Função (cargo) *</Label>
          <Select value={cargoId} onValueChange={setCargoId}>
            <SelectTrigger id="cargo"><SelectValue placeholder="Selecione a função" /></SelectTrigger>
            <SelectContent>
              {cargosDaEmpresa.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Nenhum cargo para esta empresa
                </div>
              )}
              {cargosDaEmpresa.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="obra">Obra *</Label>
          <Select value={obraId} onValueChange={setObraId}>
            <SelectTrigger id="obra"><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
            <SelectContent>
              {obrasDaEmpresa.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Nenhuma obra ativa. <Link href="/obras/new" className="underline">Cadastrar</Link>.
                </div>
              )}
              {obrasDaEmpresa.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero">Nº da OS</Label>
          <Input
            id="numero" value={numero} onChange={(e) => setNumero(e.target.value)}
            placeholder="Auto se vazio"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="revisao">Revisão</Label>
          <Input id="revisao" value={revisao} onChange={(e) => setRevisao(e.target.value)} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="observacoes">Observações (opcional)</Label>
          <textarea
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {cargoSelecionado && (
          <div className="md:col-span-2 rounded-md border bg-muted/30 p-3 text-xs space-y-1">
            <div><strong>Atividades:</strong> {cargoSelecionado.descricao_atividades ?? "—"}</div>
            <div className="text-muted-foreground">
              Os riscos e EPIs serão puxados automaticamente do cargo. Configure em <Link href={`/cargos/${cargoSelecionado.id}`} className="underline">/cargos</Link> se estiver vazio.
            </div>
          </div>
        )}

        {error && (
          <p className="md:col-span-2 text-sm text-destructive" role="alert">{error}</p>
        )}

        <div className="md:col-span-2 flex gap-2 justify-end pt-2">
          <Button variant="outline" asChild>
            <Link href="/documentos">Cancelar</Link>
          </Button>
          <Button onClick={gerar} disabled={pending || !cargoId || !obraId || !empresaId}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Gerar OS (PDF)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

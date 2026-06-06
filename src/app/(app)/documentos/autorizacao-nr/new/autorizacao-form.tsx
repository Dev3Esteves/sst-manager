"use client"

import Link from "next/link"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SignatureCanvas } from "@/components/signature-canvas"
import { Loader2, ShieldAlert } from "lucide-react"
import type { AutorizacaoNrPayload } from "../../actions"

type Empresa = { id: string; razao_social: string }
type Colaborador = { id: string; nome_completo: string; cpf: string; cargo_titulo: string | null }
type FormErrors = { _form?: string[] }

const ESCOPO_PADRAO: Record<string, string> = {
  "NR-10": "Autorizado a executar atividades em instalações elétricas energizadas e desenergizadas em BT e MT, dentro da zona controlada, conforme procedimentos da empresa e item 10.8 da NR-10.",
  "NR-35": "Autorizado a executar trabalho em altura (acima de 2,00 m do nível inferior) utilizando sistemas de proteção contra quedas, conforme item 35.3 da NR-35.",
  "NR-33": "Autorizado a atuar como Trabalhador Autorizado em espaços confinados, realizando atividades conforme Permissão de Entrada e Trabalho (PET), item 33.3.5 da NR-33.",
}

export function AutorizacaoNrForm({
  nr, empresas, colaboradores, action,
}: {
  nr: "NR-10" | "NR-35" | "NR-33"
  empresas: Empresa[]
  colaboradores: Colaborador[]
  action: (payload: AutorizacaoNrPayload) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id || "")
  const [colabId, setColabId] = useState("")
  const [dataEmissao, setDataEmissao] = useState(hojeBrasilia())
  const [dataValidade, setDataValidade] = useState("")
  const [escopo, setEscopo] = useState(ESCOPO_PADRAO[nr])
  const [respNome, setRespNome] = useState("")
  const [respCargo, setRespCargo] = useState("Engenheiro de Segurança do Trabalho")
  const [sigColab, setSigColab] = useState<string | null>(null)
  const [sigResp, setSigResp] = useState<string | null>(null)

  const colabSelecionado = colaboradores.find(c => c.id === colabId)

  function handleSubmit() {
    const payload: AutorizacaoNrPayload = {
      nr,
      empresa_id: empresaId,
      colaborador_id: colabId,
      data_emissao: dataEmissao,
      data_validade: dataValidade || null,
      escopo_autorizacao: escopo,
      responsavel_nome: respNome,
      responsavel_cargo: respCargo,
      assinatura_colaborador_data_url: sigColab ?? undefined,
      assinatura_responsavel_data_url: sigResp ?? undefined,
    }
    startTransition(async () => {
      const result = await action(payload)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Autorização {nr}</h1>
        <p className="text-muted-foreground">Emissão é bloqueada se o colaborador não tiver ASO apto + treinamento vigente da {nr}.</p>
      </div>

      <Card className="border-status-alerta">
        <CardContent className="flex items-start gap-3 py-4 text-sm">
          <ShieldAlert className="h-5 w-5 text-status-alerta shrink-0 mt-0.5" />
          <p>
            O sistema valida automaticamente <strong>antes de emitir</strong>: ASO vigente com resultado apto, e pelo menos 1 treinamento <strong>{nr}</strong> vigente do colaborador.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">1. Identificação</CardTitle></CardHeader>
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
          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <Select value={colabId} onValueChange={setColabId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {colaboradores.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome_completo}{c.cargo_titulo ? ` — ${c.cargo_titulo}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {colabSelecionado && (
              <p className="text-xs text-muted-foreground">CPF: {colabSelecionado.cpf}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="de">Data de emissão *</Label>
            <Input id="de" type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dv">Validade</Label>
            <Input id="dv" type="date" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Escopo da autorização</CardTitle>
          <CardDescription>Edite conforme a realidade do trabalho.</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={escopo} onChange={(e) => setEscopo(e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">3. Responsável pela emissão</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rn">Nome *</Label>
            <Input id="rn" value={respNome} onChange={(e) => setRespNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rc">Cargo *</Label>
            <Input id="rc" value={respCargo} onChange={(e) => setRespCargo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">4. Assinaturas</CardTitle></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-medium mb-2">Colaborador autorizado</div>
            <SignatureCanvas onChange={setSigColab} />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Responsável</div>
            <SignatureCanvas onChange={setSigResp} />
          </div>
        </CardContent>
      </Card>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form[0]}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/documentos/new">Cancelar</Link>
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending || !colabId}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Emitir {nr}
        </Button>
      </div>
    </div>
  )
}

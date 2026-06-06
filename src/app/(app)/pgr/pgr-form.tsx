"use client"

import { useState, useTransition } from "react"
import { hojeBrasilia } from "@/lib/utils/data-brasilia"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PGR_STATUS, PGR_STATUS_LABEL, type PgrStatus } from "@/lib/validations/pgr"

type Obra = {
  id: string
  nome: string
  codigo?: string | null
  cno?: string | null
  num_empregados_max?: number | null
  data_inicio?: string | null
  empresa: { razao_social: string } | { razao_social: string }[] | null
}

type Pgr = {
  id?: string
  obra_id?: string
  numero_revisao?: number
  descricao_revisao?: string | null
  data_emissao?: string
  data_vencimento?: string
  status?: PgrStatus
  responsavel_elaboracao_nome?: string | null
  responsavel_elaboracao_funcao?: string | null
  responsavel_elaboracao_crea?: string | null
  responsavel_obra_nome?: string | null
  responsavel_obra_funcao?: string | null
  responsavel_obra_crea?: string | null
  cno_obra_snapshot?: string | null
  num_empregados_snapshot?: number | null
  data_inicio_obra_snapshot?: string | null
  codigo_formulario?: string
}

export function PgrForm({
  pgr,
  obras,
  action,
  modo,
}: {
  pgr?: Pgr
  obras: Obra[]
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>
  modo: "criar" | "editar"
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [pending, startTransition] = useTransition()
  const [obraSel, setObraSel] = useState(pgr?.obra_id ?? "")
  const obraAtual = obras.find((o) => o.id === obraSel)

  function handleSubmit(formData: FormData) {
    setErrors({})
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setErrors(result.error)
    })
  }

  // Default data_vencimento = data_emissao + 12 meses
  const defaultEmissao = pgr?.data_emissao ?? hojeBrasilia()
  const defaultVencimento =
    pgr?.data_vencimento ??
    (() => {
      const d = new Date(defaultEmissao)
      d.setFullYear(d.getFullYear() + 1)
      return d.toISOString().slice(0, 10)
    })()

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {modo === "criar" ? "Novo PGR" : "Editar PGR"}
        </h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : modo === "criar" ? "Criar PGR" : "Salvar"}
          </Button>
        </div>
      </div>

      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errors._form.join(", ")}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="obra_id">Obra *</Label>
            <Select name="obra_id" value={obraSel} onValueChange={setObraSel} required>
              <SelectTrigger id="obra_id">
                <SelectValue placeholder="Selecione a obra" />
              </SelectTrigger>
              <SelectContent>
                {obras.map((o) => {
                  const emp = Array.isArray(o.empresa) ? o.empresa[0] : o.empresa
                  return (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nome}
                      {o.codigo ? ` (${o.codigo})` : ""}
                      {emp?.razao_social ? ` — ${emp.razao_social}` : ""}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {obraAtual && (
              <p className="text-xs text-muted-foreground mt-1">
                CNO: {obraAtual.cno ?? "—"} · Máx. empregados: {obraAtual.num_empregados_max ?? "—"}
              </p>
            )}
            {errors.obra_id && <p className="text-xs text-destructive mt-1">{errors.obra_id[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_revisao">Número da revisão *</Label>
              <Input
                id="numero_revisao"
                name="numero_revisao"
                type="number"
                min={0}
                defaultValue={pgr?.numero_revisao ?? 0}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                00 para emissão inicial; incrementar a cada revisão.
              </p>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={pgr?.status ?? "rascunho"}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PGR_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PGR_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descricao_revisao">Descrição da revisão</Label>
            <Input
              id="descricao_revisao"
              name="descricao_revisao"
              defaultValue={pgr?.descricao_revisao ?? ""}
              placeholder="Ex.: Inclusão do risco de espaço confinado"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_emissao">Data de emissão *</Label>
              <Input
                id="data_emissao"
                name="data_emissao"
                type="date"
                defaultValue={defaultEmissao}
                required
              />
              {errors.data_emissao && (
                <p className="text-xs text-destructive mt-1">{errors.data_emissao[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="data_vencimento">Data de vencimento *</Label>
              <Input
                id="data_vencimento"
                name="data_vencimento"
                type="date"
                defaultValue={defaultVencimento}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Padrão NR-1: +12 meses desde a emissão.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responsáveis técnicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="responsavel_elaboracao_nome">Nome (elaboração SST)</Label>
              <Input
                id="responsavel_elaboracao_nome"
                name="responsavel_elaboracao_nome"
                defaultValue={pgr?.responsavel_elaboracao_nome ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="responsavel_elaboracao_funcao">Função</Label>
              <Input
                id="responsavel_elaboracao_funcao"
                name="responsavel_elaboracao_funcao"
                defaultValue={pgr?.responsavel_elaboracao_funcao ?? ""}
                placeholder="Ex.: Supervisor de Segurança do Trabalho"
              />
            </div>
            <div>
              <Label htmlFor="responsavel_elaboracao_crea">CREA / MTE</Label>
              <Input
                id="responsavel_elaboracao_crea"
                name="responsavel_elaboracao_crea"
                defaultValue={pgr?.responsavel_elaboracao_crea ?? ""}
                placeholder="Ex.: CREA-SP 5069853674"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="responsavel_obra_nome">Nome (coord. obra)</Label>
              <Input
                id="responsavel_obra_nome"
                name="responsavel_obra_nome"
                defaultValue={pgr?.responsavel_obra_nome ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="responsavel_obra_funcao">Função</Label>
              <Input
                id="responsavel_obra_funcao"
                name="responsavel_obra_funcao"
                defaultValue={pgr?.responsavel_obra_funcao ?? ""}
                placeholder="Ex.: Coordenador de Obras"
              />
            </div>
            <div>
              <Label htmlFor="responsavel_obra_crea">CREA</Label>
              <Input
                id="responsavel_obra_crea"
                name="responsavel_obra_crea"
                defaultValue={pgr?.responsavel_obra_crea ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Snapshot da obra (na emissão)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Preserva o estado da obra no momento da emissão (útil se a obra mudar depois).
            Quando vazio, são usados os valores atuais da obra.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="cno_obra_snapshot">CNO</Label>
              <Input
                id="cno_obra_snapshot"
                name="cno_obra_snapshot"
                defaultValue={pgr?.cno_obra_snapshot ?? obraAtual?.cno ?? ""}
                placeholder="XX.XXX.XXXXX/XX"
              />
            </div>
            <div>
              <Label htmlFor="num_empregados_snapshot">Nº máx. empregados</Label>
              <Input
                id="num_empregados_snapshot"
                name="num_empregados_snapshot"
                type="number"
                min={0}
                defaultValue={pgr?.num_empregados_snapshot ?? obraAtual?.num_empregados_max ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="data_inicio_obra_snapshot">Início da obra</Label>
              <Input
                id="data_inicio_obra_snapshot"
                name="data_inicio_obra_snapshot"
                type="date"
                defaultValue={pgr?.data_inicio_obra_snapshot ?? obraAtual?.data_inicio ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadados</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="codigo_formulario">Código do formulário</Label>
            <Input
              id="codigo_formulario"
              name="codigo_formulario"
              defaultValue={pgr?.codigo_formulario ?? "FO-121-00"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Código do SGI da empresa (padrão SISTENGE: FO-121-00).
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

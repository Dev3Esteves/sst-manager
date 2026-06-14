"use client"

import Link from "next/link"
import { useState, useTransition, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ScanLine, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { AsoExtraido } from "@/lib/ocr/extrair-aso"

type Colaborador = { id: string; nome_completo: string; cpf?: string }
type Medico = { id: string; nome: string; crm: string; uf_crm: string | null; especialidade: string | null }
type Clinica = { id: string; nome: string; municipio: string | null; uf: string | null }
type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

const OCR_DATA_KEY = "sst:ocr:aso:data"

const PERIODICIDADE_MESES: Record<string, number> = {
  admissional: 12,
  periodico: 12,
  retorno_trabalho: 12,
  mudanca_funcao: 12,
  demissional: 0,
  complementar: 6,
}

type Exame = {
  id: string
  colaborador_id: string
  tipo: string
  subtipo: string | null
  data_realizacao: string
  data_vencimento: string
  resultado: string | null
  restricoes: string | null
  medico_nome: string | null
  crm: string | null
  clinica: string | null
  medico_id: string | null
  clinica_id: string | null
  numero_aso: string | null
  observacoes: string | null
}

export function ExameForm({
  colaboradores, medicos, clinicas, action, exame,
}: {
  colaboradores: Colaborador[]
  medicos: Medico[]
  clinicas: Clinica[]
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
  exame?: Exame
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [colabId, setColabId] = useState(exame?.colaborador_id ?? "")
  const [tipo, setTipo] = useState(exame?.tipo ?? "periodico")
  const [resultado, setResultado] = useState(exame?.resultado ?? "")
  const [dataRealizacao, setDataRealizacao] = useState(exame?.data_realizacao ?? "")
  const [dataVencimento, setDataVencimento] = useState(exame?.data_vencimento ?? "")
  const [prefilled, setPrefilled] = useState<string[]>([])
  // Médico e clínica: estado controlado (texto = snapshot; id = vínculo ao cadastro)
  const [medicoNome, setMedicoNome] = useState(exame?.medico_nome ?? "")
  const [crm, setCrm] = useState(exame?.crm ?? "")
  const [medicoId, setMedicoId] = useState(exame?.medico_id ?? "")
  const [clinica, setClinica] = useState(exame?.clinica ?? "")
  const [clinicaId, setClinicaId] = useState(exame?.clinica_id ?? "")
  const numeroAsoRef = useRef<HTMLInputElement>(null)

  function selecionarMedico(id: string) {
    setMedicoId(id)
    const m = medicos.find((x) => x.id === id)
    if (m) {
      setMedicoNome(m.nome)
      setCrm(m.uf_crm ? `${m.crm}/${m.uf_crm}` : m.crm)
    }
  }
  function selecionarClinica(id: string) {
    setClinicaId(id)
    const c = clinicas.find((x) => x.id === id)
    if (c) setClinica(c.nome)
  }

  // Ao montar, verifica se há dados do OCR em sessionStorage e pré-preenche
  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem(OCR_DATA_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw) as AsoExtraido
      sessionStorage.removeItem(OCR_DATA_KEY) // consome uma única vez
      const preenchidos: string[] = []

      if (data.tipo) { setTipo(data.tipo); preenchidos.push("tipo") }
      if (data.resultado) { setResultado(data.resultado); preenchidos.push("resultado") }
      if (data.data_realizacao) { setDataRealizacao(data.data_realizacao); preenchidos.push("data_realizacao") }
      if (data.data_vencimento) { setDataVencimento(data.data_vencimento); preenchidos.push("data_vencimento") }

      // Tenta achar o colaborador pelo CPF
      if (data.cpf) {
        const cpfDigits = data.cpf.replace(/\D/g, "")
        const match = colaboradores.find((c) => c.cpf?.replace(/\D/g, "") === cpfDigits)
        if (match) { setColabId(match.id); preenchidos.push("colaborador (via CPF)") }
      }

      // Médico/CRM/clínica via OCR → estado controlado (sem vínculo a cadastro)
      if (data.medico_nome) { setMedicoNome(data.medico_nome); setMedicoId(""); preenchidos.push("medico") }
      if (data.crm) { setCrm(data.crm); preenchidos.push("crm") }
      if (data.clinica) { setClinica(data.clinica); setClinicaId(""); preenchidos.push("clinica") }

      // numero_aso é input não-controlado: popula via ref após o próximo tick
      setTimeout(() => {
        if (data.numero_aso && numeroAsoRef.current) {
          numeroAsoRef.current.value = data.numero_aso
          preenchidos.push("numero_aso")
        }
        setPrefilled(preenchidos)
        if (preenchidos.length > 0) {
          toast.success(`${preenchidos.length} campo(s) pré-preenchido(s) via OCR`, {
            description: "Revise antes de salvar.",
            duration: 6000,
          })
        }
      }, 0)
    } catch (err) {
      console.error("[ocr prefill]", err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleRealizacaoChange(v: string) {
    setDataRealizacao(v)
    const meses = PERIODICIDADE_MESES[tipo]
    if (v && meses) {
      const d = new Date(v)
      d.setMonth(d.getMonth() + meses)
      setDataVencimento(d.toISOString().slice(0, 10))
    }
  }

  async function handleSubmit(formData: FormData) {
    formData.set("colaborador_id", colabId)
    formData.set("tipo", tipo)
    if (resultado) formData.set("resultado", resultado)
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {prefilled.length > 0 && (
        <div className="rounded-md border border-status-regular bg-status-regular/10 p-3 text-sm flex gap-2 items-start">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-status-regular" />
          <div>
            <p className="font-medium text-status-regular">
              {prefilled.length} campo(s) pré-preenchido(s) via OCR
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Revise todos os campos antes de salvar. Campos: {prefilled.join(", ")}.
            </p>
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/exames/ocr">
            <ScanLine className="h-4 w-4" />
            Escanear ASO (OCR)
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{exame ? "Editar exame médico" : "Registrar exame médico"}</CardTitle>
          <CardDescription>ASO (Atestado de Saúde Ocupacional) — PCMSO.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="colaborador_id">Colaborador *</Label>
            <Select value={colabId} onValueChange={setColabId}>
              <SelectTrigger id="colaborador_id"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {colaboradores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError error={errors.colaborador_id} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admissional">Admissional</SelectItem>
                <SelectItem value="periodico">Periódico</SelectItem>
                <SelectItem value="retorno_trabalho">Retorno ao Trabalho</SelectItem>
                <SelectItem value="mudanca_funcao">Mudança de Função</SelectItem>
                <SelectItem value="demissional">Demissional</SelectItem>
                <SelectItem value="complementar">Complementar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtipo">Subtipo (ex: audiometria)</Label>
            <Input id="subtipo" name="subtipo" defaultValue={exame?.subtipo ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_realizacao">Data de realização *</Label>
            <Input
              id="data_realizacao" name="data_realizacao" type="date"
              value={dataRealizacao} onChange={(e) => handleRealizacaoChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Data de vencimento *</Label>
            <Input
              id="data_vencimento" name="data_vencimento" type="date"
              value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Calculado automaticamente pelo tipo; pode ser ajustado.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resultado">Resultado</Label>
            <Select value={resultado} onValueChange={setResultado}>
              <SelectTrigger id="resultado"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apto">Apto</SelectItem>
                <SelectItem value="apto_restricao">Apto com restrição</SelectItem>
                <SelectItem value="inapto">Inapto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero_aso">Número do ASO</Label>
            <Input id="numero_aso" name="numero_aso" ref={numeroAsoRef} defaultValue={exame?.numero_aso ?? ""} />
          </div>
          <input type="hidden" name="medico_id" value={medicoId} />
          <input type="hidden" name="clinica_id" value={clinicaId} />
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="medico_cadastro">Médico responsável (cadastro)</Label>
              <Link href="/medicos/new" target="_blank" className="text-xs text-primary hover:underline">+ Cadastrar médico</Link>
            </div>
            <Select value={medicoId} onValueChange={selecionarMedico}>
              <SelectTrigger id="medico_cadastro"><SelectValue placeholder={medicos.length ? "Selecione um médico cadastrado" : "Nenhum médico cadastrado"} /></SelectTrigger>
              <SelectContent>
                {medicos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome} — CRM {m.crm}{m.uf_crm ? `/${m.uf_crm}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="medico_nome">Médico (nome no ASO)</Label>
            <Input
              id="medico_nome" name="medico_nome" value={medicoNome}
              onChange={(e) => { setMedicoNome(e.target.value); setMedicoId("") }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <Input id="crm" name="crm" value={crm} onChange={(e) => { setCrm(e.target.value); setMedicoId("") }} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="clinica_cadastro">Clínica (cadastro)</Label>
              <Link href="/clinicas/new" target="_blank" className="text-xs text-primary hover:underline">+ Cadastrar clínica</Link>
            </div>
            <Select value={clinicaId} onValueChange={selecionarClinica}>
              <SelectTrigger id="clinica_cadastro"><SelectValue placeholder={clinicas.length ? "Selecione uma clínica cadastrada" : "Nenhuma clínica cadastrada"} /></SelectTrigger>
              <SelectContent>
                {clinicas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}{c.municipio ? ` — ${c.municipio}${c.uf ? `/${c.uf}` : ""}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clinica">Clínica (nome no ASO)</Label>
            <Input id="clinica" name="clinica" value={clinica} onChange={(e) => { setClinica(e.target.value); setClinicaId("") }} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="restricoes">Restrições</Label>
            <Input id="restricoes" name="restricoes" defaultValue={exame?.restricoes ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Input id="observacoes" name="observacoes" defaultValue={exame?.observacoes ?? ""} />
          </div>
          {errors._form && (
            <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/exames">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {exame ? "Salvar" : "Registrar"}
        </Button>
      </div>
    </form>
  )
}

function FieldError({ error }: { error?: string[] }) {
  if (!error?.length) return null
  return <p className="text-xs text-destructive">{error[0]}</p>
}

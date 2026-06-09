"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Info, RotateCcw } from "lucide-react"
import { TEXTO_CERTIFICADO_PADRAO, VARIAVEIS_DISPONIVEIS } from "@/lib/pdf/certificado-texto"

type Treinamento = {
  id?: string
  titulo: string
  nr_referencia?: string | null
  carga_horaria_horas: number
  validade_meses?: number | null
  tipo: string
  modalidade: string
  texto_certificado?: string | null
  cidade_emissao?: string | null
  conteudo_programatico?: string[] | null
}

type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function TreinamentoForm({
  treinamento, action,
}: {
  treinamento?: Treinamento
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState(treinamento?.tipo || "obrigatorio")
  const [modalidade, setModalidade] = useState(treinamento?.modalidade || "presencial")
  const [textoCert, setTextoCert] = useState(treinamento?.texto_certificado ?? "")
  const [conteudoRaw, setConteudoRaw] = useState(
    (treinamento?.conteudo_programatico ?? []).join("\n"),
  )

  function inserirVariavel(tag: string) {
    const textarea = document.getElementById("texto_certificado") as HTMLTextAreaElement | null
    if (!textarea) {
      setTextoCert((prev) => prev + tag)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const novo = textoCert.slice(0, start) + tag + textoCert.slice(end)
    setTextoCert(novo)
    // restore cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + tag.length)
    }, 10)
  }

  function restaurarPadrao() {
    setTextoCert(TEXTO_CERTIFICADO_PADRAO)
  }

  async function handleSubmit(formData: FormData) {
    formData.set("tipo", tipo)
    formData.set("modalidade", modalidade)
    formData.set("conteudo_programatico_raw", conteudoRaw)
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{treinamento ? "Editar treinamento" : "Novo treinamento"}</CardTitle>
          <CardDescription>Adicione ao catálogo. Validade alimenta os vencimentos automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" name="titulo" defaultValue={treinamento?.titulo} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nr_referencia">NR de referência</Label>
            <Input id="nr_referencia" name="nr_referencia" defaultValue={treinamento?.nr_referencia ?? ""} placeholder="NR-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carga_horaria_horas">Carga horária (h) *</Label>
            <Input id="carga_horaria_horas" name="carga_horaria_horas" type="number" step="0.5" min="0"
              defaultValue={treinamento?.carga_horaria_horas} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validade_meses">Validade (meses)</Label>
            <Input id="validade_meses" name="validade_meses" type="number" min="0"
              defaultValue={treinamento?.validade_meses ?? ""} placeholder="Ex: 24 (deixe vazio se não vencer)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                <SelectItem value="reciclagem">Reciclagem</SelectItem>
                <SelectItem value="complementar">Complementar</SelectItem>
                <SelectItem value="integracao">Integração</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="modalidade">Modalidade *</Label>
            <Select value={modalidade} onValueChange={setModalidade}>
              <SelectTrigger id="modalidade"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="ead">EAD</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade_emissao">Cidade de emissão</Label>
            <Input id="cidade_emissao" name="cidade_emissao" defaultValue={treinamento?.cidade_emissao ?? ""} placeholder="São Paulo" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conteúdo programático (verso do certificado)</CardTitle>
          <CardDescription>
            Uma linha por tópico. Aparecem como lista no verso do certificado. Se vazio, mostra texto genérico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={conteudoRaw}
            onChange={(e) => setConteudoRaw(e.target.value)}
            rows={6}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            placeholder={"Riscos elétricos e medidas de controle\nAnálise de risco e APR\nSegurança em instalações desenergizadas\nTrabalhos envolvendo alta-tensão\nAPR, PET e PT\nResponsabilidades"}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {conteudoRaw.split("\n").filter((l) => l.trim()).length} tópico(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Texto do certificado (frente)</CardTitle>
          <CardDescription>
            Este texto aparece no centro do certificado. Use variáveis entre chaves duplas — ex: <code className="text-xs bg-muted px-1">{'{{aluno_nome}}'}</code> — que são substituídas no momento da geração do PDF. Deixe vazio para usar o texto padrão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Clique nas variáveis abaixo para inserir no texto na posição do cursor.
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={restaurarPadrao}>
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar texto padrão
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {VARIAVEIS_DISPONIVEIS.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => inserirVariavel(v.tag)}
                title={v.descricao}
                className="inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-mono hover:bg-accent transition-colors"
              >
                {v.tag}
              </button>
            ))}
          </div>

          <textarea
            id="texto_certificado"
            name="texto_certificado"
            value={textoCert}
            onChange={(e) => setTextoCert(e.target.value)}
            rows={8}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={TEXTO_CERTIFICADO_PADRAO}
          />

          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="font-semibold mb-1">Preview (com valores de exemplo):</div>
            <p className="whitespace-pre-wrap">
              {previewTexto(textoCert || TEXTO_CERTIFICADO_PADRAO)}
            </p>
          </div>
        </CardContent>
      </Card>

      {errors._form && <p className="text-sm text-destructive" role="alert">{errors._form[0]}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild><Link href="/treinamentos">Cancelar</Link></Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {treinamento ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

/** Preview local — substitui variáveis por valores demo, sem chamar servidor. */
function previewTexto(template: string): string {
  const exemplo: Record<string, string> = {
    aluno_nome: "JOÃO DA SILVA",
    aluno_cpf: "123.456.789-00",
    curso_titulo: "NR-10 Básico — Segurança em Instalações e Serviços em Eletricidade",
    nr_referencia: "NR-10",
    nr_referencia_parenteses: " (NR-10)",
    carga_horaria: "40",
    data_realizacao: "15/04/2026",
    data_vencimento: "15/04/2028",
    cidade: "São Paulo",
    entidade: "Centro de Treinamento ABC",
    entidade_trecho: ", ministrado por Centro de Treinamento ABC",
    instrutor: "Maria Oliveira",
    empresa: "Empresa Demo",
    validade_trecho: " O certificado é válido até 15/04/2028.",
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => exemplo[key] ?? match)
}

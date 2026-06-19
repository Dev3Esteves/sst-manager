"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, FileSignature, RotateCcw } from "lucide-react"
import { TEXTO_CERTIFICADO_PADRAO, VARIAVEIS_DISPONIVEIS } from "@/lib/pdf/certificado-texto"

type SalvarResult = { ok: true } | { error: Record<string, string[] | undefined> & { _form?: string[] } }

export function TemplateCertificadoForm({
  templateAtual,
  onSalvar,
}: {
  templateAtual: string | null
  /** Server action (já vinculada ao alvo) que grava o template. */
  onSalvar: (formData: FormData) => Promise<SalvarResult>
}) {
  const [texto, setTexto] = useState(templateAtual ?? "")
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const usandoPadrao = texto.trim().length === 0

  function salvar() {
    setErro(null)
    const formData = new FormData()
    formData.set("template_certificado", texto)
    startTransition(async () => {
      const result = await onSalvar(formData)
      if ("error" in result) {
        const msg = result.error._form?.[0] ?? result.error.template_certificado?.[0] ?? "Erro ao salvar"
        setErro(msg)
        toast.error(msg)
      } else {
        toast.success(usandoPadrao ? "Template restaurado para o padrão do sistema." : "Template salvo.")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSignature className="h-5 w-5" /> Template padrão de certificado
        </CardTitle>
        <CardDescription>
          Texto base usado nos certificados de treinamento da organização. Um treinamento com
          texto próprio sempre tem precedência. Deixe em branco para usar o padrão do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="template_certificado">Corpo do certificado</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTexto(TEXTO_CERTIFICADO_PADRAO)}
              title="Preencher com o texto padrão do sistema para editar a partir dele"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Usar padrão como base
            </Button>
          </div>
          <textarea
            id="template_certificado"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={6}
            placeholder={TEXTO_CERTIFICADO_PADRAO}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {usandoPadrao && (
            <p className="text-xs text-muted-foreground">
              Em branco — os certificados usarão o texto padrão do sistema.
            </p>
          )}
          {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
        </div>

        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Variáveis disponíveis (clique para inserir)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {VARIAVEIS_DISPONIVEIS.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => setTexto((t) => `${t}${v.tag}`)}
                title={v.descricao}
                className="rounded bg-background border px-2 py-1 text-xs font-mono hover:border-primary transition-colors"
              >
                {v.tag}
              </button>
            ))}
          </div>
        </div>

        <Button type="button" onClick={salvar} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar template
        </Button>
      </CardContent>
    </Card>
  )
}

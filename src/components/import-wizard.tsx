"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Upload, Download, CheckCircle2, XCircle, Loader2, FileSpreadsheet, ArrowLeft } from "lucide-react"
import { processarCsv, gerarTemplate } from "@/lib/import/runner"
import type { ImportSchema } from "@/lib/import/types"
import type { z } from "zod"
import type { LinhaResultado } from "@/lib/import/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyImportSchema = ImportSchema<z.ZodTypeAny>

type Props<T extends AnyImportSchema> = {
  schema: T
  titulo: string
  descricao: string
  voltarHref: string
  /** Server action que recebe array de linhas válidas e retorna contagem/erros. */
  action: (rows: z.infer<T["schema"]>[]) => Promise<{
    inseridos: number
    erros?: string[]
  }>
}

export function ImportWizard<T extends AnyImportSchema>({
  schema, titulo, descricao, voltarHref, action,
}: Props<T>) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [resultados, setResultados] = useState<LinhaResultado<z.infer<T["schema"]>>[] | null>(null)
  const [processando, setProcessando] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivo(file)
    setResultados(null)
    setProcessando(true)

    try {
      const texto = await file.text()
      const { resultados: res } = processarCsv(texto, schema)
      setResultados(res)
      const validos = res.filter((r) => r.ok).length
      const invalidos = res.length - validos
      if (res.length === 0) {
        toast.warning("Planilha vazia", { description: "Nenhuma linha de dados encontrada." })
      } else {
        toast.info(`${res.length} linha(s) processada(s)`, {
          description: `${validos} válidas, ${invalidos} com erros.`,
        })
      }
    } catch (err) {
      toast.error("Falha ao ler arquivo", {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setProcessando(false)
    }
  }

  function baixarTemplate() {
    const csv = gerarTemplate(schema)
    // BOM UTF-8 para Excel pt-BR reconhecer acentos
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = schema.templateFilename
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Template baixado", { description: "Abra no Excel/Google Sheets e preencha." })
  }

  function importar() {
    if (!resultados) return
    const validos = resultados.filter((r) => r.ok).map((r) => (r as Extract<typeof r, { ok: true }>).valor)
    if (validos.length === 0) {
      toast.warning("Nada para importar", { description: "Corrija os erros e tente novamente." })
      return
    }
    startTransition(async () => {
      try {
        const { inseridos, erros } = await action(validos)
        if (erros && erros.length > 0) {
          toast.error(`${inseridos} inseridos, ${erros.length} erro(s)`, {
            description: erros.slice(0, 3).join(" · "),
          })
        } else {
          toast.success(`${inseridos} registro(s) importado(s)`)
        }
        router.push(voltarHref)
      } catch (err) {
        toast.error("Falha ao importar", {
          description: err instanceof Error ? err.message : String(err),
        })
      }
    })
  }

  const validos = resultados?.filter((r) => r.ok).length ?? 0
  const invalidos = resultados?.filter((r) => !r.ok).length ?? 0

  return (
    <div className="container py-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7" />
            {titulo}
          </h1>
          <p className="text-muted-foreground">{descricao}</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={voltarHref}><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Baixar template (recomendado)</CardTitle>
          <CardDescription>
            O template CSV já tem os cabeçalhos corretos + uma linha de exemplo. Abra no Excel ou Google Sheets, preencha e salve como <strong>.csv</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={baixarTemplate}>
            <Download className="h-4 w-4" />
            Baixar {schema.templateFilename}
          </Button>
          <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs">
            <p className="font-medium mb-1">Colunas esperadas:</p>
            <div className="flex flex-wrap gap-1">
              {schema.colunas.map((c) => (
                <Badge key={c.key} variant={c.obrigatorio ? "critico" : "outline"} title={c.exemplo}>
                  {c.label}{c.obrigatorio ? " *" : ""}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground mt-2">
              <strong>Obrigatórios</strong> em laranja. Aliases de nome de coluna são aceitos (ex: &quot;nome&quot; ≡ &quot;Nome Completo&quot;).
              Datas no formato AAAA-MM-DD ou DD/MM/AAAA.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Enviar planilha preenchida</CardTitle>
          <CardDescription>
            Arquivo CSV (separado por vírgula OU ponto-e-vírgula). Máx. 10 MB. Primeira linha = cabeçalho.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("csv-file")?.click()}
              disabled={processando}
            >
              <Upload className="h-4 w-4" />
              {arquivo ? "Trocar arquivo" : "Escolher CSV"}
            </Button>
            {arquivo && (
              <span className="text-sm text-muted-foreground">
                <strong>{arquivo.name}</strong> ({(arquivo.size / 1024).toFixed(1)} KB)
              </span>
            )}
            {processando && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardContent>
      </Card>

      {resultados && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">3. Revisão</CardTitle>
                  <CardDescription>
                    {validos} válida(s), {invalidos} com erro(s) — só as válidas serão importadas.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="regular">{validos} ✓</Badge>
                  {invalidos > 0 && <Badge variant="vencido">{invalidos} ✗</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {invalidos > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-status-vencido flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Linhas com erro ({invalidos})
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Linha</TableHead>
                        <TableHead>Erros encontrados</TableHead>
                        <TableHead>Dados</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.filter((r) => !r.ok).slice(0, 20).map((r, i) => {
                        if (r.ok) return null
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{r.linha}</TableCell>
                            <TableCell>
                              <ul className="text-xs text-status-vencido space-y-0.5">
                                {r.erros.map((e, j) => <li key={j}>• {e}</li>)}
                              </ul>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={JSON.stringify(r.original)}>
                              {Object.entries(r.original).filter(([, v]) => v).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(" · ")}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  {invalidos > 20 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Mostrando 20 primeiros erros. Corrija-os no CSV e envie novamente.
                    </p>
                  )}
                </div>
              )}

              {validos > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-status-regular flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Preview das válidas — primeiras 10 de {validos}
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Linha</TableHead>
                        {schema.colunas.slice(0, 5).map((c) => (
                          <TableHead key={c.key} className="text-xs">{c.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.filter((r) => r.ok).slice(0, 10).map((r, i) => {
                        if (!r.ok) return null
                        const v = r.valor as Record<string, unknown>
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{r.linha}</TableCell>
                            {schema.colunas.slice(0, 5).map((c) => (
                              <TableCell key={c.key} className="text-xs">{String(v[c.key] ?? "—")}</TableCell>
                            ))}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t -mx-6 px-6">
            <Button variant="outline" asChild>
              <Link href={voltarHref}>Cancelar</Link>
            </Button>
            <Button onClick={importar} disabled={pending || validos === 0}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar {validos} registro(s)
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

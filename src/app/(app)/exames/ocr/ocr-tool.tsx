"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Upload, ScanLine, CheckCircle2, ArrowRight, RotateCcw, AlertTriangle, FileText } from "lucide-react"
import { extrairAso, type AsoExtraido } from "@/lib/ocr/extrair-aso"

type Status = "idle" | "processando" | "concluido" | "erro"

const OCR_DATA_KEY = "sst:ocr:aso:data"

const TIPO_LABEL: Record<string, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  retorno_trabalho: "Retorno ao trabalho",
  mudanca_funcao: "Mudança de função",
  demissional: "Demissional",
  complementar: "Complementar",
}

const RESULTADO_LABEL: Record<string, string> = {
  apto: "Apto",
  inapto: "Inapto",
  apto_restricao: "Apto com restrição",
}

export function OcrTool() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [progresso, setProgresso] = useState<number>(0)
  const [textoOcr, setTextoOcr] = useState<string>("")
  const [extraido, setExtraido] = useState<AsoExtraido | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    const tipoOk = file.type.startsWith("image/") || file.type === "application/pdf"
    if (!tipoOk) {
      toast.error("Formato não suportado", {
        description: "Use PNG, JPG ou PDF escaneado do ASO.",
      })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: "Máx. 10 MB." })
      return
    }
    setArquivo(file)
    setStatus("idle")
    setTextoOcr("")
    setExtraido(null)
    setErro(null)

    // Preview apenas para imagens (PDF não renderiza bem em img)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function processar() {
    if (!arquivo) {
      toast.warning("Selecione um arquivo primeiro.")
      return
    }
    setStatus("processando")
    setProgresso(0)
    setErro(null)

    try {
      // Import dinâmico — tesseract.js é pesado (~2 MB wasm + 10 MB dados de idioma)
      // Só carrega quando o usuário efetivamente vai usar, não no bundle inicial.
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("por", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgresso(Math.round(m.progress * 100))
          }
        },
      })

      const { data: { text } } = await worker.recognize(arquivo)
      await worker.terminate()

      setTextoOcr(text)
      const fields = extrairAso(text)
      setExtraido(fields)
      setStatus("concluido")

      const camposEncontrados = Object.values(fields).filter((v) => v !== null).length
      toast.success(`OCR concluído`, {
        description: `${camposEncontrados} campo(s) identificado(s). Revise antes de prosseguir.`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErro(msg)
      setStatus("erro")
      toast.error("Falha no OCR", { description: msg })
    }
  }

  function resetar() {
    setArquivo(null)
    setPreview(null)
    setTextoOcr("")
    setExtraido(null)
    setStatus("idle")
    setProgresso(0)
    setErro(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function usarNoFormulario() {
    if (!extraido) return
    // Salva os dados no sessionStorage — /exames/new vai ler e pré-preencher
    try {
      sessionStorage.setItem(OCR_DATA_KEY, JSON.stringify(extraido))
      toast.success("Pré-preenchendo formulário...")
      router.push("/exames/new")
    } catch (err) {
      toast.error("Não foi possível salvar os dados", {
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const camposOK = extraido ? Object.values(extraido).filter((v) => v !== null).length : 0
  const totalCampos = extraido ? Object.keys(extraido).length : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ScanLine className="h-7 w-7" />
            Escanear ASO
          </h1>
          <p className="text-muted-foreground">
            Envie uma foto ou PDF digitalizado do ASO e extraia os campos automaticamente. Tudo processado no seu navegador — nada é enviado para servidores externos.
          </p>
        </div>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Enviar documento</CardTitle>
          <CardDescription>
            PNG, JPG ou PDF com digitalização legível. Máx. 10 MB.
            Dica: fotos bem iluminadas e alinhadas funcionam melhor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="h-48 w-64 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview do ASO" className="max-h-full max-w-full object-contain" />
              ) : arquivo?.type === "application/pdf" ? (
                <div className="flex flex-col items-center text-muted-foreground gap-1">
                  <FileText className="h-8 w-8 opacity-50" />
                  <span className="text-xs">{arquivo.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground gap-1">
                  <Upload className="h-8 w-8 opacity-50" />
                  <span className="text-xs">Sem arquivo</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-[200px] space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {arquivo ? "Trocar arquivo" : "Escolher arquivo"}
                </Button>
                {arquivo && (
                  <Button variant="ghost" onClick={resetar}>
                    <RotateCcw className="h-4 w-4" />
                    Limpar
                  </Button>
                )}
              </div>
              {arquivo && (
                <p className="text-xs text-muted-foreground">
                  <strong>{arquivo.name}</strong> ({(arquivo.size / 1024).toFixed(1)} KB, {arquivo.type})
                </p>
              )}
              <div className="rounded-md border border-status-alerta bg-status-alerta/10 p-2.5 text-xs">
                <p className="font-medium">ℹ️ Primeira vez processando?</p>
                <p className="text-muted-foreground mt-1">
                  O Tesseract baixa ~10 MB de dados do idioma português no primeiro uso. Depois fica em cache.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Processar OCR</CardTitle>
          <CardDescription>
            Leva ~10–30 segundos dependendo da resolução da imagem e da velocidade do seu computador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={processar}
            disabled={!arquivo || status === "processando"}
            size="lg"
            className="w-full"
          >
            {status === "processando"
              ? <><Loader2 className="h-4 w-4 animate-spin" />Processando... {progresso}%</>
              : <><ScanLine className="h-4 w-4" />Processar OCR</>}
          </Button>

          {status === "processando" && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
          )}

          {status === "erro" && erro && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Erro:</strong> {erro}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado */}
      {status === "concluido" && extraido && (
        <>
          <Card className="border-status-regular">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-status-regular" />
                  3. Campos identificados
                </CardTitle>
                <Badge variant={camposOK >= 5 ? "regular" : camposOK >= 3 ? "alerta" : "vencido"}>
                  {camposOK} de {totalCampos} campos
                </Badge>
              </div>
              <CardDescription>
                Confira os dados extraídos antes de prosseguir. O extrator é tolerante a erros mas pode ter falhado em alguns campos — ajuste tudo no formulário depois.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Campo label="CPF" value={extraido.cpf} />
                <Campo label="Número do ASO" value={extraido.numero_aso} />
                <Campo label="Tipo de exame" value={extraido.tipo ? TIPO_LABEL[extraido.tipo] : null} />
                <Campo label="Resultado" value={extraido.resultado ? RESULTADO_LABEL[extraido.resultado] : null} />
                <Campo label="Data de realização" value={formatDateBr(extraido.data_realizacao)} />
                <Campo label="Data de vencimento" value={formatDateBr(extraido.data_vencimento)} />
                <Campo label="Médico" value={extraido.medico_nome} />
                <Campo label="CRM" value={extraido.crm} />
                <Campo label="Clínica" value={extraido.clinica} className="md:col-span-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Texto extraído (OCR bruto)</CardTitle>
              <CardDescription>
                Útil para checar se o OCR capturou bem ou se a imagem precisa ser melhorada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Expandir texto completo ({textoOcr.length} caracteres)
                </summary>
                <pre className="mt-3 p-3 bg-muted rounded text-xs font-mono whitespace-pre-wrap max-h-96 overflow-auto">
                  {textoOcr}
                </pre>
              </details>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t -mx-6 px-6">
            <Button variant="outline" asChild>
              <Link href="/exames">Cancelar</Link>
            </Button>
            <Button onClick={usarNoFormulario} size="lg">
              Usar no formulário
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {camposOK < 3 && (
            <div className="rounded-md border border-status-alerta bg-status-alerta/10 p-3 text-sm flex gap-2 items-start">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-status-alerta" />
              <div>
                <p className="font-medium">Poucos campos identificados</p>
                <p className="text-muted-foreground mt-1">
                  A qualidade da imagem pode estar baixa. Você pode prosseguir e preencher no formulário, ou tentar com uma imagem mais nítida/alinhada.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Campo({ label, value, className }: { label: string; value: string | null; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-medium text-sm ${value ? "" : "text-muted-foreground italic"}`}>
        {value ?? "(não identificado)"}
      </div>
    </div>
  )
}

function formatDateBr(iso: string | null): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

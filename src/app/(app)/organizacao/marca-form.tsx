"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Image as ImageIcon, Upload, X } from "lucide-react"
import { salvarMarcaOrganizacao } from "./actions"

export function MarcaForm({
  nome,
  nomeFantasia,
  logoUrl,
}: {
  nome: string
  nomeFantasia: string | null
  logoUrl: string | null
}) {
  const [nomeVal, setNomeVal] = useState(nome)
  const [fantasiaVal, setFantasiaVal] = useState(nomeFantasia ?? "")
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoAcao, setLogoAcao] = useState<"" | "remover">("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    setLogoAcao("")
    if (file) setLogoPreview(URL.createObjectURL(file))
  }

  function removerLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoAcao("remover")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function salvar() {
    setErro(null)
    const formData = new FormData()
    formData.set("nome", nomeVal)
    formData.set("nome_fantasia", fantasiaVal)
    if (logoFile) formData.set("logo", logoFile)
    if (logoAcao === "remover") formData.set("logo_acao", "remover")
    startTransition(async () => {
      const result = await salvarMarcaOrganizacao(formData)
      if ("error" in result) {
        const msg = result.error._form?.[0] ?? result.error.nome?.[0] ?? "Erro ao salvar"
        setErro(msg)
        toast.error(msg)
      } else {
        toast.success("Marca salva.")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Marca da organização</CardTitle>
        <CardDescription>
          Nome e logo usados na identidade do sistema e nos documentos emitidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={nomeVal} onChange={(e) => setNomeVal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome_fantasia">Nome fantasia</Label>
          <Input
            id="nome_fantasia"
            value={fantasiaVal}
            onChange={(e) => setFantasiaVal(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="h-32 w-48 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/30 overflow-hidden">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Preview do logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground gap-1">
                  <ImageIcon className="h-8 w-8 opacity-50" />
                  <span className="text-xs">Sem logo</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <input
                ref={fileInputRef}
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {logoPreview ? "Trocar logo" : "Enviar logo"}
                </Button>
                {logoPreview && (
                  <Button type="button" variant="ghost" onClick={removerLogo}>
                    <X className="h-4 w-4" /> Remover
                  </Button>
                )}
              </div>
              {logoFile && (
                <p className="text-xs text-muted-foreground">
                  Novo arquivo: <strong>{logoFile.name}</strong> ({(logoFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        </div>

        {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}

        <Button type="button" onClick={salvar} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar marca
        </Button>
      </CardContent>
    </Card>
  )
}

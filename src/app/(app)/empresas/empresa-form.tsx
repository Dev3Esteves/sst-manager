"use client"

import Link from "next/link"
import { useState, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"

type Empresa = {
  id?: string
  razao_social: string
  nome_fantasia?: string | null
  cnpj: string
  inscricao_estadual?: string | null
  tipo: string | null
  dona_sistema?: boolean | null
  empresa_mae_id?: string | null
  ativo: boolean
  logo_url?: string | null
}

type EmpresaOpcao = { id: string; razao_social: string }

type FormErrors = Record<string, string[] | undefined> & { _form?: string[] }

export function EmpresaForm({
  empresa,
  donasDisponiveis = [],
  action,
}: {
  empresa?: Empresa
  donasDisponiveis?: EmpresaOpcao[]
  action: (formData: FormData) => Promise<{ error?: FormErrors } | void>
}) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState(empresa?.tipo || "contratante")
  const [donaSistema, setDonaSistema] = useState<boolean>(empresa?.dona_sistema ?? false)
  const [empresaMaeId, setEmpresaMaeId] = useState<string>(empresa?.empresa_mae_id ?? "")

  const [logoPreview, setLogoPreview] = useState<string | null>(empresa?.logo_url ?? null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoAcao, setLogoAcao] = useState<"" | "remover">("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ _form: ["Logo deve ter no máximo 2 MB."] })
      return
    }
    setLogoFile(file)
    setLogoAcao("")
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removerLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoAcao("remover")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(formData: FormData) {
    formData.set("tipo", tipo)
    formData.set("dona_sistema", donaSistema ? "on" : "")
    formData.set("empresa_mae_id", donaSistema ? "" : empresaMaeId)
    if (logoAcao === "remover") formData.set("logo_acao", "remover")
    // logoFile já está no FormData via input type="file" name="logo"
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setErrors(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{empresa ? "Editar empresa" : "Nova empresa"}</CardTitle>
          <CardDescription>Dados cadastrais da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="razao_social">Razão social *</Label>
            <Input id="razao_social" name="razao_social" defaultValue={empresa?.razao_social} required />
            <FieldError error={errors.razao_social} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome fantasia</Label>
            <Input id="nome_fantasia" name="nome_fantasia" defaultValue={empresa?.nome_fantasia ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input id="cnpj" name="cnpj" defaultValue={empresa?.cnpj} placeholder="00.000.000/0000-00" required />
            <FieldError error={errors.cnpj} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inscricao_estadual">Inscrição estadual</Label>
            <Input id="inscricao_estadual" name="inscricao_estadual" defaultValue={empresa?.inscricao_estadual ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Classificação *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="propria">Dona do sistema (executa obras)</SelectItem>
                <SelectItem value="contratante">Contratante (cliente onde a dona atua)</SelectItem>
                <SelectItem value="terceira">Prestadora (presta serviço para a dona)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define como esta empresa se relaciona com o sistema.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2 rounded-md border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="dona_sistema"
                checked={donaSistema}
                onChange={(e) => setDonaSistema(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-gray-300"
              />
              <div>
                <Label htmlFor="dona_sistema" className="font-semibold">
                  Esta é uma empresa dona do sistema (multi-tenant)
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quando marcado, a empresa hospeda seus próprios colaboradores, documentos e
                  relatórios, podendo ter contratantes e prestadoras vinculadas.
                </p>
              </div>
            </div>
          </div>
          {!donaSistema && donasDisponiveis.length > 0 && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="empresa_mae_id">Empresa dona responsável</Label>
              <Select value={empresaMaeId || "none"} onValueChange={(v) => setEmpresaMaeId(v === "none" ? "" : v)}>
                <SelectTrigger id="empresa_mae_id"><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {donasDisponiveis.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Opcional. Identifica a qual empresa dona esta prestadora/contratante pertence.
              </p>
            </div>
          )}
          <div className="flex items-center space-x-2 pt-2 md:col-span-2">
            <input
              type="checkbox"
              id="ativo"
              name="ativo"
              defaultChecked={empresa?.ativo ?? true}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="ativo">Empresa ativa</Label>
          </div>
          {errors._form && (
            <p className="text-sm text-destructive md:col-span-2" role="alert">{errors._form[0]}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logo da empresa</CardTitle>
          <CardDescription>
            Aparece no cabeçalho dos certificados de treinamento e demais documentos emitidos pela empresa.
            Formatos: PNG, JPG, WebP. Tamanho máximo: 2 MB. Proporção recomendada: retangular ou quadrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <input type="hidden" name="logo_acao" value={logoAcao} />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {logoPreview ? "Trocar logo" : "Enviar logo"}
                </Button>
                {logoPreview && (
                  <Button type="button" variant="ghost" onClick={removerLogo}>
                    <X className="h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>

              {logoFile && (
                <p className="text-xs text-muted-foreground">
                  Novo arquivo: <strong>{logoFile.name}</strong> ({(logoFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {!logoFile && logoPreview && (
                <p className="text-xs text-muted-foreground">
                  Logo atual. Envie outro arquivo ou clique em Remover.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" asChild>
          <Link href="/empresas">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {empresa ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

function FieldError({ error }: { error?: string[] }) {
  if (!error?.length) return null
  return <p className="text-xs text-destructive">{error[0]}</p>
}

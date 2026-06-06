import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { OcorrenciaForm } from "./ocorrencia-form"
import { createOcorrencia } from "../actions"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OCORRENCIA_TIPOS, type TemplateOcorrenciaInit } from "@/lib/validations/ocorrencia"
import { AlertTriangle, FilePlus2 } from "lucide-react"

export default async function NewOcorrenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const [{ data: empresas }, { data: colaboradores }, { data: templates }, { data: locais }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("colaboradores").select("id, nome_completo").eq("status", "ativo").order("nome_completo"),
    supabase.from("templates_ocorrencia").select("id, tipo, titulo, descricao_modelo").eq("ativo", true).order("titulo"),
    supabase.from("obra_locais").select("id, nome, obras(nome)").eq("ativo", true).order("nome"),
  ])

  const obraLocais = (locais ?? []).map((l) => ({
    id: l.id, nome: l.nome,
    obra_nome: (Array.isArray(l.obras) ? l.obras[0] : l.obras)?.nome ?? "Obra",
  }))

  // Etapa 1 — sem escolha ainda e há templates: mostra o seletor.
  if (sp.template === undefined && (templates?.length ?? 0) > 0) {
    return (
      <div className="container py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrar ocorrência</h1>
          <p className="text-muted-foreground">Escolha um modelo para agilizar o registro, ou comece em branco.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {templates?.map((t) => (
            <Link key={t.id} href={`/ocorrencias/new?template=${t.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-status-alerta/10 text-status-alerta">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{t.titulo}</CardTitle>
                      <CardDescription className="mt-1">{OCORRENCIA_TIPOS[t.tipo] ?? t.tipo}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
          <Link href="/ocorrencias/new?template=blank">
            <Card className="h-full border-dashed transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <FilePlus2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Em branco</CardTitle>
                    <CardDescription className="mt-1">Formulário vazio, sem modelo.</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    )
  }

  // Etapa 2 — form (com ou sem template pré-carregado).
  let templateInit: TemplateOcorrenciaInit | undefined
  if (sp.template && sp.template !== "blank") {
    const { data: tpl } = await supabase
      .from("templates_ocorrencia")
      .select("tipo, descricao_modelo, gravidade_sugerida, natureza_lesao_sugerida, agente_causador_sugerido, roteiro_investigacao")
      .eq("id", sp.template)
      .maybeSingle()
    if (tpl) {
      templateInit = {
        tipo: tpl.tipo,
        descricao_modelo: tpl.descricao_modelo,
        gravidade_sugerida: tpl.gravidade_sugerida,
        natureza_lesao_sugerida: tpl.natureza_lesao_sugerida,
        agente_causador_sugerido: tpl.agente_causador_sugerido,
        roteiro_investigacao: (tpl.roteiro_investigacao as string[] | null) ?? null,
      }
    }
  }

  return (
    <div className="container py-8 max-w-3xl">
      <OcorrenciaForm
        empresas={empresas ?? []}
        colaboradores={colaboradores ?? []}
        obraLocais={obraLocais}
        action={createOcorrencia}
        templateInit={templateInit}
      />
    </div>
  )
}

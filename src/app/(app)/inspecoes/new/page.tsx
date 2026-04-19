import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck } from "lucide-react"

export default async function ChooseTemplatePage() {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from("templates_inspecao")
    .select("id, titulo, categoria, periodicidade, itens")
    .eq("ativo", true)
    .order("titulo")

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova inspeção</h1>
        <p className="text-muted-foreground">Escolha um template para iniciar o checklist.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates?.map((t) => {
          const itens = (t.itens as unknown[]) ?? []
          return (
            <Link key={t.id} href={`/inspecoes/new/${t.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{t.titulo}</CardTitle>
                      <CardDescription className="mt-1 capitalize">
                        {t.categoria ?? "—"} · {t.periodicidade ?? "sob demanda"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-sm text-muted-foreground">{itens.length} itens</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        {(!templates || templates.length === 0) && (
          <Card className="md:col-span-2">
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum template ativo. Cadastre em Configurações.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

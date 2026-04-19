import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InspecaoForm } from "./inspecao-form"
import { createInspecao } from "../../actions"
import type { TemplateItem } from "@/lib/validations/inspecao"

export default async function NewInspecaoPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  const supabase = await createClient()
  const [{ data: template }, { data: empresas }] = await Promise.all([
    supabase.from("templates_inspecao").select("*").eq("id", templateId).single(),
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
  ])

  if (!template) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      <InspecaoForm
        template={{
          id: template.id,
          titulo: template.titulo,
          categoria: template.categoria,
          itens: (template.itens as TemplateItem[]) ?? [],
        }}
        empresas={empresas ?? []}
        action={createInspecao}
      />
    </div>
  )
}

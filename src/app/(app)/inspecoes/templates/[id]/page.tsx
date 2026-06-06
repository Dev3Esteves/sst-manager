import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { TemplateInspecaoForm } from "../template-form"
import { updateTemplateInspecao } from "../actions"
import type { TemplateInspecaoInput, TemplateItem } from "@/lib/validations/inspecao"

export default async function EditTemplateInspecaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status !== "ok") {
    return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  }

  const { data: template } = await r.ctx.supabase
    .from("templates_inspecao")
    .select("id, titulo, categoria, periodicidade, ativo, itens")
    .eq("id", id)
    .single()
  if (!template) notFound()

  async function handleUpdate(payload: TemplateInspecaoInput) {
    "use server"
    return updateTemplateInspecao(id, payload)
  }

  return (
    <div className="container py-8 max-w-3xl">
      <TemplateInspecaoForm
        template={{
          id: template.id,
          titulo: template.titulo,
          categoria: template.categoria,
          periodicidade: template.periodicidade,
          ativo: !!template.ativo,
          itens: (template.itens as TemplateItem[]) ?? [],
        }}
        action={handleUpdate}
      />
    </div>
  )
}

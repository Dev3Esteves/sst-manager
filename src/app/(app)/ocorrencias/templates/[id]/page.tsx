import { notFound } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { TemplateOcorrenciaForm } from "../template-form"
import { updateTemplateOcorrencia } from "../actions"
import type { TemplateOcorrenciaInput } from "@/lib/validations/ocorrencia"

export default async function EditTemplateOcorrenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status !== "ok") {
    return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  }

  const { data: template } = await r.ctx.supabase
    .from("templates_ocorrencia")
    .select("id, tipo, titulo, descricao_modelo, gravidade_sugerida, natureza_lesao_sugerida, agente_causador_sugerido, roteiro_investigacao, is_sistema")
    .eq("id", id)
    .single()
  if (!template) notFound()

  async function handleUpdate(payload: TemplateOcorrenciaInput) {
    "use server"
    return updateTemplateOcorrencia(id, payload)
  }

  return (
    <div className="container py-8 max-w-3xl">
      <TemplateOcorrenciaForm
        template={{
          id: template.id,
          tipo: template.tipo,
          titulo: template.titulo,
          descricao_modelo: template.descricao_modelo,
          gravidade_sugerida: template.gravidade_sugerida,
          natureza_lesao_sugerida: template.natureza_lesao_sugerida,
          agente_causador_sugerido: template.agente_causador_sugerido,
          roteiro_investigacao: (template.roteiro_investigacao as string[] | null) ?? null,
          is_sistema: !!template.is_sistema,
        }}
        action={handleUpdate}
      />
    </div>
  )
}

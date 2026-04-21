/**
 * POST /api/jobs/documentos-lote
 *
 * Enfileira um job de geração em lote (caminho assíncrono recomendado).
 * A rota síncrona antiga `/api/documentos/lote` continua existindo para
 * retro-compat mas deve ser depreciada — em lotes grandes ela estoura o
 * timeout do Vercel.
 *
 * Retorna imediatamente com `{ jobId }`. A UI deve fazer polling em
 * `/api/jobs/[id]` até status == "completed" e então baixar via
 * `/api/jobs/[id]/download`.
 */
import { NextResponse } from "next/server"
import { requireAuth, authErrorToResponse } from "@/lib/auth/guards"
import { withRouteLogging } from "@/lib/logger"
import { enqueueJob } from "@/lib/jobs/queue"
import { documentosLoteInputSchema } from "@/lib/jobs/processors/documentos-lote"

export async function POST(req: Request) {
  return withRouteLogging("jobs/documentos-lote/enqueue", req, async (log) => {
    let supabase, user
    try {
      ;({ supabase, user } = await requireAuth())
    } catch (e) {
      const resp = authErrorToResponse(e); if (resp) return resp
      throw e
    }

    const body = await req.json().catch(() => null)
    const parsed = documentosLoteInputSchema.safeParse(body)
    if (!parsed.success) {
      log.warn("invalid payload", { issue: parsed.error.errors[0]?.message })
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Payload inválido" },
        { status: 400 },
      )
    }

    // Resolve empresa_id: o input pode ter (autorizacao_nr) ou precisamos
    // derivar do user (certificado usa do treinamento/colab).
    // Por ora pegamos do input quando presente, senão do usuario.
    let empresaId: string | null = null
    if (parsed.data.tipo === "autorizacao_nr") {
      empresaId = parsed.data.empresa_id
    } else {
      const { data: link } = await supabase
        .from("usuarios").select("empresa_id").eq("id", user.id).single()
      empresaId = link?.empresa_id ?? null
    }
    if (!empresaId) {
      log.warn("sem empresa resolvida")
      return NextResponse.json({ error: "empresa do usuário não encontrada" }, { status: 400 })
    }

    const { id } = await enqueueJob(supabase, {
      type: "documentos_lote",
      input: parsed.data,
      empresa_id: empresaId,
      user_id: user.id,
      progress_total: parsed.data.colaborador_ids.length,
    })

    log.info("enqueued", {
      jobId: id,
      tipo: parsed.data.tipo,
      count: parsed.data.colaborador_ids.length,
      userId: user.id,
    })

    return NextResponse.json({ jobId: id }, { status: 202 })
  })
}

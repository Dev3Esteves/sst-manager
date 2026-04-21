/**
 * GET /api/jobs/[id]
 *
 * Retorna o status atual de um job. Usado pela UI em polling.
 *
 * Shape mínimo:
 *   { id, type, status, progress: { current, total, pct }, result, error_message, ...}
 *
 * Propositalmente NÃO inclui signed URL aqui — essa URL expira em 1h e fica
 * fora do shape de status. Download usa endpoint dedicado.
 */
import { NextResponse } from "next/server"
import { requireAuth, authErrorToResponse } from "@/lib/auth/guards"
import { withRouteLogging } from "@/lib/logger"
import { getJob } from "@/lib/jobs/queue"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withRouteLogging("jobs/status", req, async (log) => {
    const { id } = await params

    let supabase
    try {
      ;({ supabase } = await requireAuth())
    } catch (e) {
      const resp = authErrorToResponse(e); if (resp) return resp
      throw e
    }

    const job = await getJob(supabase, id)
    if (!job) {
      // Pode ser RLS bloqueando (job de outra empresa) OU não existir. Do
      // ponto de vista da UI, é 404 em ambos os casos.
      log.warn("job not found or forbidden", { jobId: id })
      return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
    }

    const pct =
      job.progress_total && job.progress_total > 0
        ? Math.round(((job.progress_current ?? 0) / job.progress_total) * 100)
        : null

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: {
        current: job.progress_current ?? 0,
        total: job.progress_total,
        pct,
      },
      attempts: job.attempts,
      max_attempts: job.max_attempts,
      error_message: job.error_message,
      result_summary: job.result?.summary ?? null,
      result_filename: job.result?.filename ?? null,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
    })
  })
}

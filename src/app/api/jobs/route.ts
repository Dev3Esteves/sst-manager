/**
 * GET /api/jobs
 *
 * Lista jobs do usuário atual (RLS filtra por empresa). Paginação simples
 * via ?limit + ?offset + ?status.
 */
import { NextResponse } from "next/server"
import { requireAuth, authErrorToResponse } from "@/lib/auth/guards"
import { withRouteLogging } from "@/lib/logger"
import { listJobs } from "@/lib/jobs/queue"

export async function GET(req: Request) {
  return withRouteLogging("jobs/list", req, async () => {
    let supabase
    try {
      ;({ supabase } = await requireAuth())
    } catch (e) {
      const resp = authErrorToResponse(e); if (resp) return resp
      throw e
    }

    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100)
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0)
    const status = url.searchParams.get("status") ?? undefined

    const jobs = await listJobs(supabase, { limit, offset, status })

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        progress: {
          current: j.progress_current ?? 0,
          total: j.progress_total,
          pct:
            j.progress_total && j.progress_total > 0
              ? Math.round(((j.progress_current ?? 0) / j.progress_total) * 100)
              : null,
        },
        error_message: j.error_message,
        result_filename: j.result?.filename ?? null,
        created_at: j.created_at,
        completed_at: j.completed_at,
      })),
      limit,
      offset,
    })
  })
}

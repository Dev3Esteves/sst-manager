/**
 * GET /api/jobs/[id]/download
 *
 * Gera uma signed URL temporária (1h) pro objeto no bucket `job-results` e
 * redireciona (302) pro browser baixar direto do Supabase Storage.
 *
 * Por que redirect em vez de proxy do conteúdo?
 *   - Evita que a função serverless tenha que puxar o ZIP inteiro via rede
 *     só pra repassar. Arquivos grandes ficariam lentos e caros.
 *   - Browser faz o GET da signed URL direto no Storage. Funciona igual
 *     com Range requests, pausar/retomar download etc.
 *
 * RLS: `getJob` já filtra pelo usuário atual. Então só quem criou o job
 * (ou admin) consegue gerar a URL.
 */
import { NextResponse } from "next/server"
import { requireAuth, authErrorToResponse } from "@/lib/auth/guards"
import { withRouteLogging } from "@/lib/logger"
import { getJob } from "@/lib/jobs/queue"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withRouteLogging("jobs/download", req, async (log) => {
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
      return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
    }
    if (job.status !== "completed" || !job.result?.storage_path) {
      return NextResponse.json(
        { error: `Job ainda não está completo (status: ${job.status})` },
        { status: 409 },
      )
    }

    // Signed URL de 1h (3600s) — suficiente pra usuário baixar mesmo em
    // conexão lenta, sem deixar URL "eterna".
    const { data: signed, error } = await supabase.storage
      .from("job-results")
      .createSignedUrl(job.result.storage_path, 3600, {
        download: job.result.filename ?? undefined,
      })

    if (error || !signed?.signedUrl) {
      log.exception("createSignedUrl falhou", error, { jobId: id })
      return NextResponse.json({ error: "Não foi possível gerar URL de download" }, { status: 500 })
    }

    // Redirect 302 — o browser segue e baixa direto
    return NextResponse.redirect(signed.signedUrl, 302)
  })
}

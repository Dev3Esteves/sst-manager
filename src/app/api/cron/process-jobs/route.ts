/**
 * Worker de jobs — chamado pelo Vercel Cron a cada minuto.
 *
 * Fluxo:
 *  1. Verifica `Authorization: Bearer $CRON_SECRET` — rejeita chamadas
 *     externas. Vercel injeta esse header automaticamente quando a cron
 *     é disparada pelo próprio sistema.
 *  2. Claim atômico do próximo job via `claim_next_job` (SKIP LOCKED).
 *  3. Dispatch pro processor apropriado.
 *  4. Em sucesso: `markJobCompleted` com o resultado.
 *     Em falha: `markJobFailed` que decide entre retry ou final.
 *
 * Limite: processamos apenas UM job por invocação. Isso limita o tempo total
 * da função (vercel hobby = 10s, pro = 60s). A cron dispara todo minuto de
 * qualquer jeito, então a throughput é 1 job/min por worker.
 *
 * Para escalar: múltiplas crons em paralelo ou mover o worker pra uma
 * Supabase Edge Function (tem timeout maior).
 *
 * Observabilidade: tudo logado via `logger` estruturado (ciclo #8).
 */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger, newRequestId } from "@/lib/logger"
import { claimNextJob, markJobCompleted, markJobFailed, updateProgress, makeWorkerId } from "@/lib/jobs/queue"
import { dispatchJob } from "@/lib/jobs/dispatch"

// Força runtime Node (precisamos do @react-pdf/renderer e libs pesadas —
// Edge runtime não serve aqui).
export const runtime = "nodejs"
// Desliga qualquer cache agressivo que o Next possa aplicar a rotas sem body
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const requestId = newRequestId()
  const log = logger.child({ route: "cron/process-jobs", requestId })

  // 1. Valida CRON_SECRET
  const secret = process.env.CRON_SECRET
  if (!secret) {
    log.error("CRON_SECRET not configured — rejeitando todas as chamadas")
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
  }
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    log.warn("cron-auth-failed")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const workerId = makeWorkerId()
  const scoped = log.child({ workerId })

  // 2. Claim próximo job
  let job
  try {
    job = await claimNextJob(supabase, workerId)
  } catch (err) {
    scoped.exception("claim falhou", err)
    return NextResponse.json({ error: "claim failed" }, { status: 500 })
  }

  if (!job) {
    // Fila vazia — normal, volta 200 silencioso pro Vercel não marcar erro
    scoped.debug("no job to process")
    return NextResponse.json({ ok: true, idle: true })
  }

  const jobLog = scoped.child({ jobId: job.id, jobType: job.type, attempts: job.attempts })
  jobLog.info("job claimed")

  // 3. Dispatch
  const end = jobLog.time("job-processing")
  try {
    const result = await dispatchJob(supabase, job, async (current, total) => {
      await updateProgress(supabase, job.id, { current, total })
    })
    await markJobCompleted(supabase, job.id, result)
    end({ outcome: "completed", bytes: result.bytes })
    jobLog.info("job completed", {
      storagePath: result.storage_path,
      bytes: result.bytes,
      summary: result.summary,
    })
    return NextResponse.json({ ok: true, jobId: job.id, status: "completed" })
  } catch (err) {
    end({ outcome: "failed" })
    jobLog.exception("job processor threw", err)
    try {
      await markJobFailed(supabase, job.id, err)
    } catch (persistErr) {
      // Se nem conseguimos marcar como failed, o job fica em 'processing'
      // com claimed_by preenchido até alguém intervir. Loga pra investigar.
      jobLog.exception("markJobFailed também falhou", persistErr)
    }
    // Ainda retornamos 200 pro Vercel não spam-alertar — o erro já está logado
    return NextResponse.json({ ok: false, jobId: job.id, status: "failed" })
  }
}

/** POST é alias do GET — pra facilitar trigger manual via fetch de testes */
export const POST = GET

/**
 * Helpers da fila de jobs.
 *
 * Thin layer sobre o Supabase client — a lógica de FSM (queued → processing
 * → completed|failed) mora aqui, pra manter processors focados na regra de
 * negócio.
 *
 * Importante: o `claim` usa a função SQL `claim_next_job` (SECURITY DEFINER,
 * SKIP LOCKED). Isso garante atomicidade — dois workers rodando ao mesmo
 * tempo não pegam o mesmo job.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { JobRecord, JobResult, JobType } from "./types"

// Supabase client genérico — aceita o client com tipos do projeto ou sem
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, "public", any>

/**
 * Enfileira um novo job. Retorna o id criado.
 *
 * O caller precisa passar `user_id` e `empresa_id` explicitamente — evita
 * depender de RLS pra popular, porque o enqueue pode ser feito via route
 * handler que já tem contexto resolvido.
 */
export async function enqueueJob(
  supabase: AnySupabase,
  params: {
    type: JobType
    input: Record<string, unknown>
    empresa_id: string
    user_id: string
    progress_total?: number | null
  },
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      type: params.type,
      input: params.input,
      empresa_id: params.empresa_id,
      user_id: params.user_id,
      progress_total: params.progress_total ?? null,
      status: "queued",
    })
    .select("id")
    .single()

  if (error) throw new Error(`enqueueJob: ${error.message}`)
  return { id: data.id as string }
}

/**
 * Reivindica o próximo job da fila pro worker `workerId`.
 *
 * Retorna null se a fila está vazia (normal — cron dispara todo minuto
 * mesmo sem trabalho).
 */
export async function claimNextJob(
  supabase: AnySupabase,
  workerId: string,
): Promise<JobRecord | null> {
  const { data, error } = await supabase.rpc("claim_next_job", { worker_id: workerId })
  if (error) throw new Error(`claimNextJob: ${error.message}`)
  if (!data) return null
  // A função SQL retorna uma linha de `jobs` — o postgrest devolve como
  // array ou objeto dependendo da versão. Normalizamos.
  return Array.isArray(data) ? (data[0] as JobRecord | undefined) ?? null : (data as JobRecord)
}

/**
 * Atualiza progresso de um job em processamento. Idempotente — tudo bem
 * chamar N vezes com o mesmo valor.
 */
export async function updateProgress(
  supabase: AnySupabase,
  jobId: string,
  progress: { current: number; total?: number | null },
): Promise<void> {
  const update: Record<string, unknown> = { progress_current: progress.current }
  if (progress.total !== undefined) update.progress_total = progress.total
  const { error } = await supabase.from("jobs").update(update).eq("id", jobId)
  if (error) throw new Error(`updateProgress: ${error.message}`)
}

/**
 * Marca job como concluído com sucesso.
 */
export async function markJobCompleted(
  supabase: AnySupabase,
  jobId: string,
  result: JobResult,
): Promise<void> {
  const { error } = await supabase
    .from("jobs")
    .update({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId)
  if (error) throw new Error(`markJobCompleted: ${error.message}`)
}

/**
 * Marca job como falho. Se ainda houver attempts restantes, volta para
 * `queued` pra retry; caso contrário finaliza como `failed`.
 *
 * Escolha consciente: worker lê o `attempts` atual (o claim já incrementou
 * antes de chamar o processor) e decide. Isso centraliza a política de retry
 * em um lugar só.
 */
export async function markJobFailed(
  supabase: AnySupabase,
  jobId: string,
  err: unknown,
): Promise<void> {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "unknown error"

  // Busca o estado atual pra decidir se retry ou final
  const { data: current, error: readErr } = await supabase
    .from("jobs")
    .select("attempts, max_attempts")
    .eq("id", jobId)
    .single()
  if (readErr) throw new Error(`markJobFailed read: ${readErr.message}`)

  const stillHasAttempts = current.attempts < current.max_attempts
  const nextStatus = stillHasAttempts ? "queued" : "failed"

  const detail: Record<string, unknown> = {
    attempts_used: current.attempts,
    max_attempts: current.max_attempts,
  }
  if (err instanceof Error && err.stack) {
    detail.stack = err.stack.split("\n").slice(0, 10).join("\n")
  }

  const update: Record<string, unknown> = {
    status: nextStatus,
    error_message: message.slice(0, 2000),
    error_detail: detail,
  }
  if (nextStatus === "failed") {
    update.completed_at = new Date().toISOString()
  } else {
    // Libera o claim pra outro worker pegar na próxima rodada
    update.claimed_by = null
    update.claimed_at = null
  }

  const { error: writeErr } = await supabase.from("jobs").update(update).eq("id", jobId)
  if (writeErr) throw new Error(`markJobFailed write: ${writeErr.message}`)
}

/**
 * Busca um job por id. Retorna null se não existir ou se o RLS bloquear.
 */
export async function getJob(
  supabase: AnySupabase,
  jobId: string,
): Promise<JobRecord | null> {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle()
  if (error) throw new Error(`getJob: ${error.message}`)
  return (data as JobRecord | null) ?? null
}

/**
 * Lista jobs do usuário atual (RLS filtra por empresa). Paginação simples.
 */
export async function listJobs(
  supabase: AnySupabase,
  opts: { limit?: number; offset?: number; status?: string } = {},
): Promise<JobRecord[]> {
  const limit = Math.min(opts.limit ?? 20, 100)
  const offset = opts.offset ?? 0
  let q = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (opts.status) q = q.eq("status", opts.status)
  const { data, error } = await q
  if (error) throw new Error(`listJobs: ${error.message}`)
  return (data as JobRecord[] | null) ?? []
}

/**
 * Gera um worker id estável-mas-único. Vercel roda funções em instâncias
 * separadas, então combinamos hostname (quando disponível) + timestamp +
 * ruído. Serve principalmente pra auditoria.
 */
export function makeWorkerId(): string {
  const host = process.env.VERCEL_REGION || process.env.HOSTNAME || "local"
  const rand = Math.random().toString(36).slice(2, 8)
  return `${host}-${Date.now().toString(36)}-${rand}`
}

/**
 * Tipos compartilhados pela fila de jobs.
 *
 * Separados em arquivo próprio pra evitar ciclo (queue.ts importa processors,
 * processors importam types — se types estiver em queue.ts, ciclo).
 */

export type JobType = "documentos_lote" | "os_nr01_gerar" | "ficha_epi_batch"

export type JobStatus = "queued" | "processing" | "completed" | "failed"

export interface JobRecord {
  id: string
  type: JobType
  status: JobStatus
  input: Record<string, unknown>
  result: JobResult | null
  progress_current: number | null
  progress_total: number | null
  error_message: string | null
  error_detail: Record<string, unknown> | null
  empresa_id: string
  user_id: string
  attempts: number
  max_attempts: number
  claimed_by: string | null
  claimed_at: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

/**
 * Resultado padronizado de um job.
 *
 * `storage_path` aponta pra objeto no bucket `job-results`; a UI deve pedir
 * uma signed URL quando for baixar (expira em 1h, então não adianta guardar
 * a URL aqui).
 */
export interface JobResult {
  storage_path: string | null
  filename: string | null
  content_type: string | null
  bytes: number | null
  /** Contagens específicas por tipo (gerados, pulados, etc) */
  summary: Record<string, unknown>
}

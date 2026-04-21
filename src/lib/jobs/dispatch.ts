/**
 * Dispatcher — mapeia `job.type` pro processor correspondente.
 *
 * O worker (`/api/cron/process-jobs`) chama `dispatchJob()` passando o record
 * claimed. Este arquivo centraliza o switch de tipo pra um lugar só, e é o
 * único lugar onde novos processors precisam ser registrados.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  documentosLoteInputSchema,
  processDocumentosLote,
} from "./processors/documentos-lote"
import type { JobRecord, JobResult } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, "public", any>

export async function dispatchJob(
  supabase: AnySupabase,
  job: JobRecord,
  onProgress?: (current: number, total: number) => Promise<void>,
): Promise<JobResult> {
  switch (job.type) {
    case "documentos_lote": {
      const input = documentosLoteInputSchema.parse(job.input)
      return processDocumentosLote(supabase, input, {
        userId: job.user_id,
        jobId: job.id,
        onProgress,
      })
    }
    case "os_nr01_gerar":
    case "ficha_epi_batch":
      // MVP: só `documentos_lote` por ora. Estender aqui conforme necessário.
      throw new Error(`Tipo de job '${job.type}' ainda não implementado.`)
    default: {
      // Exhaustiveness check — se adicionar novo tipo no enum TS e esquecer
      // aqui, o TS quebra o build.
      const _exhaust: never = job.type
      throw new Error(`Tipo de job desconhecido: ${String(_exhaust)}`)
    }
  }
}

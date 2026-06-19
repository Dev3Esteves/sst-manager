"use client"

/**
 * Lista de jobs com polling automático.
 *
 * Comportamento:
 *   - Renderiza inicialmente com dados SSR (sem flicker).
 *   - Se houver algum job em `queued` ou `processing`, faz polling em
 *     `/api/jobs?limit=50` a cada 3s.
 *   - Polling para automaticamente quando tudo está terminado.
 *   - Ao clicar "Baixar", abre `/api/jobs/[id]/download` em nova aba —
 *     o endpoint devolve 302 pra signed URL do Supabase Storage.
 */
import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"

type JobItem = {
  id: string
  type: string
  status: string
  progress: { current: number; total: number | null; pct: number | null }
  error_message: string | null
  result_filename: string | null
  created_at: string
  completed_at: string | null
}

function humanStatus(status: string): string {
  switch (status) {
    case "queued": return "Na fila"
    case "processing": return "Processando"
    case "completed": return "Concluído"
    case "failed": return "Falhou"
    default: return status
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "queued": return <Clock className="h-4 w-4" />
    case "processing": return <Loader2 className="h-4 w-4 animate-spin" />
    case "completed": return <CheckCircle2 className="h-4 w-4" />
    case "failed": return <XCircle className="h-4 w-4" />
    default: return null
  }
}

function humanType(type: string): string {
  switch (type) {
    case "documentos_lote": return "Geração de documentos em lote"
    case "os_nr01_gerar": return "Emissão de OS NR-01"
    case "ficha_epi_batch": return "Fichas de EPI em lote"
    default: return type
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function JobsListLive({ initial }: { initial: JobItem[] }) {
  const [jobs, setJobs] = useState<JobItem[]>(initial)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const anyActive = jobs.some((j) => j.status === "queued" || j.status === "processing")
    if (!anyActive) {
      if (pollTimer.current) clearTimeout(pollTimer.current)
      return
    }

    async function poll() {
      try {
        const res = await fetch("/api/jobs?limit=50", { cache: "no-store" })
        if (res.ok) {
          const body = (await res.json()) as { jobs: JobItem[] }
          setJobs(body.jobs)
        }
      } catch {
        // Silencioso — se a rede cair, a próxima iteração tenta de novo
      }
      pollTimer.current = setTimeout(poll, 3000)
    }

    pollTimer.current = setTimeout(poll, 3000)
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current)
    }
  }, [jobs])

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhum job ainda. Quando você disparar uma geração em lote, ela aparece aqui com o progresso.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}

function JobCard({ job }: { job: JobItem }) {
  const pct = job.progress.pct ?? 0
  const isActive = job.status === "queued" || job.status === "processing"

  const variant =
    job.status === "completed" ? "regular" as const :
    job.status === "failed" ? "vencido" as const :
    job.status === "processing" ? "alerta" as const :
    "secondary" as const

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-sm font-medium">{humanType(job.type)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Criado {formatDateTime(job.created_at)}
              {job.completed_at && ` · Concluído ${formatDateTime(job.completed_at)}`}
            </div>
          </div>
          <Badge variant={variant} className="flex items-center gap-1.5 shrink-0">
            {statusIcon(job.status)}
            {humanStatus(job.status)}
          </Badge>
        </div>

        {isActive && job.progress.total ? (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {job.progress.current} / {job.progress.total} ({pct}%)
            </div>
          </div>
        ) : null}

        {job.status === "completed" && job.result_filename && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground truncate">
              {job.result_filename}
            </div>
            <Button size="sm" asChild>
              <a href={`/api/jobs/${job.id}/download`} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
                Baixar
              </a>
            </Button>
          </div>
        )}

        {job.status === "failed" && job.error_message && (
          <div className="flex items-start gap-2 text-xs text-status-vencido bg-status-vencido/10 rounded p-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="break-all">{job.error_message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

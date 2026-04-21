import { getAuth } from "@/lib/auth/guards"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert, ListTodo } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { JobsListLive } from "./jobs-list-live"

/**
 * Página de jobs assíncronos.
 *
 * Server component resolve auth e carrega lista inicial; client component
 * (JobsListLive) assume daí e faz polling periódico pra refletir progresso.
 *
 * Render inicial SSR — evita flicker de "carregando" quando já temos os
 * dados. Polling só acontece se houver job em andamento (queued/processing).
 */
export const dynamic = "force-dynamic"

export default async function JobsPage() {
  const ctx = await getAuth()
  if (!ctx) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex items-start gap-3 py-6">
            <ShieldAlert className="h-5 w-5 text-status-vencido" />
            <p className="text-sm">Autenticação necessária.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { supabase } = ctx
  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, type, status, progress_current, progress_total, error_message, result, created_at, started_at, completed_at",
    )
    .order("created_at", { ascending: false })
    .limit(50)

  const initial = (jobs ?? []).map((j) => ({
    id: j.id as string,
    type: j.type as string,
    status: j.status as string,
    progress: {
      current: (j.progress_current as number) ?? 0,
      total: (j.progress_total as number | null) ?? null,
      pct:
        j.progress_total && (j.progress_total as number) > 0
          ? Math.round((((j.progress_current as number) ?? 0) / (j.progress_total as number)) * 100)
          : null,
    },
    error_message: (j.error_message as string | null) ?? null,
    result_filename:
      (j.result as { filename?: string } | null)?.filename ?? null,
    created_at: j.created_at as string,
    completed_at: (j.completed_at as string | null) ?? null,
  }))

  return (
    <div className="container py-8 space-y-6">
      <PageHeader
        icon={<ListTodo />}
        title="Fila de jobs"
        description="Geração em lote de PDFs processada de forma assíncrona — essa página mostra progresso em tempo real e disponibiliza o download quando cada job termina."
      />
      <JobsListLive initial={initial} />
    </div>
  )
}

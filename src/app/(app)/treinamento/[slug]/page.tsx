import Link from "next/link"
import { notFound } from "next/navigation"
import { getAuth } from "@/lib/auth/guards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock, BookOpen, CheckCircle2, ShieldAlert } from "lucide-react"
import { TRILHA } from "@/lib/treinamento/trilha"
import { getQuiz } from "@/lib/treinamento/quizzes"
import { getManual } from "@/lib/ajuda/manuais"
import { ConcluirButton } from "./concluir-button"
import { QuizModulo } from "./quiz-modulo"

export const dynamic = "force-dynamic"

export default async function ModuloTreinamentoPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ bloqueio?: string }>
}) {
  const { slug } = await params
  const { bloqueio } = await searchParams
  // Rota que o usuário tentou acessar e foi barrado pela trava (volta pra lá ao concluir).
  const returnTo = bloqueio && bloqueio.startsWith("/") ? bloqueio : null
  const ctx = await getAuth()
  if (!ctx) return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>

  const index = TRILHA.findIndex((m) => m.slug === slug)
  if (index === -1) notFound()
  const modulo = TRILHA[index]
  const anterior = index > 0 ? TRILHA[index - 1] : null
  const proximo = index < TRILHA.length - 1 ? TRILHA[index + 1] : null

  const { data: progresso } = await ctx.supabase
    .from("treinamento_sistema_progresso")
    .select("modulo_slug")
    .eq("usuario_id", ctx.user.id)
  const concluidos = new Set((progresso ?? []).map((p) => p.modulo_slug))

  const desbloqueado = !anterior || concluidos.has(anterior.slug)
  const jaConcluido = concluidos.has(modulo.slug)

  // Quando o usuário chega aqui barrado pela trava (?bloqueio=), liberamos este
  // módulo mesmo fora da ordem da trilha — a trava é por módulo (independente).
  if (!desbloqueado && !returnTo) {
    return (
      <div className="container py-10 max-w-2xl text-center space-y-4">
        <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Módulo bloqueado</h1>
        <p className="text-muted-foreground">
          Conclua o módulo anterior{anterior ? ` — “${anterior.titulo}” —` : ""} para liberar este.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" asChild><Link href="/treinamento">Voltar à trilha</Link></Button>
          {anterior && <Button asChild><Link href={`/treinamento/${anterior.slug}`}>Ir ao módulo anterior</Link></Button>}
        </div>
      </div>
    )
  }

  const manuais = (modulo.manuais ?? []).map((s) => getManual(s)).filter(Boolean)
  // O quiz vai ao cliente sem a resposta correta (validação é no servidor).
  const quiz = getQuiz(modulo.slug).map((q) => ({ pergunta: q.pergunta, opcoes: q.opcoes }))

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Voltar à trilha" asChild><Link href="/treinamento"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{modulo.secao} · Módulo {modulo.ordem}</div>
          <h1 className="text-3xl font-bold tracking-tight">{modulo.titulo}</h1>
        </div>
      </div>

      {returnTo && !jaConcluido && (
        <div className="rounded-md border border-status-alerta/40 bg-status-alerta/10 p-3 text-sm flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-status-alerta mt-0.5 shrink-0" />
          <span>
            Para usar esse recurso você precisa concluir este treinamento primeiro.
            Ao marcar como concluído, você volta automaticamente para onde estava.
          </span>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Objetivo</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{modulo.objetivo}</p></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">O que você vai aprender</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {modulo.topicos.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-status-regular mt-0.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {(manuais.length > 0 || (modulo.rotas?.length ?? 0) > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Aprofunde e pratique</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {manuais.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">Manuais relacionados</div>
                {manuais.map((m) => m && (
                  <Link key={m.slug} href={`/ajuda/${m.slug}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <BookOpen className="h-4 w-4" /> {m.titulo}
                  </Link>
                ))}
              </div>
            )}
            {(modulo.rotas?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {modulo.rotas!.map((r) => (
                  <Button key={r.href} variant="outline" size="sm" asChild><Link href={r.href}>{r.label}</Link></Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {quiz.length > 0
        ? <QuizModulo slug={modulo.slug} perguntas={quiz} jaConcluido={jaConcluido} nextSlug={proximo?.slug ?? null} returnTo={returnTo} />
        : (
          <div className="flex items-center justify-between gap-2 border-t pt-4">
            {anterior
              ? <Button variant="ghost" asChild><Link href={`/treinamento/${anterior.slug}`}><ArrowLeft className="h-4 w-4" />Anterior</Link></Button>
              : <span />}
            <ConcluirButton slug={modulo.slug} jaConcluido={jaConcluido} nextSlug={proximo?.slug ?? null} returnTo={returnTo} />
          </div>
        )}
    </div>
  )
}

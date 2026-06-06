import Link from "next/link"
import { getAuth } from "@/lib/auth/guards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Lock, PlayCircle, GraduationCap } from "lucide-react"
import { TRILHA, SECOES_TRILHA } from "@/lib/treinamento/trilha"

export const dynamic = "force-dynamic"

export default async function TreinamentoPage() {
  const ctx = await getAuth()
  if (!ctx) return <div className="container py-10 text-center text-muted-foreground">Sessão expirada. Faça login.</div>

  const { data: progresso } = await ctx.supabase
    .from("treinamento_sistema_progresso")
    .select("modulo_slug")
    .eq("usuario_id", ctx.user.id)
  const concluidos = new Set((progresso ?? []).map((p) => p.modulo_slug))

  // Desbloqueio sequencial: módulo N abre quando N-1 está concluído.
  let anteriorConcluido = true
  const estado = TRILHA.map((m) => {
    const desbloqueado = anteriorConcluido
    const concluido = concluidos.has(m.slug)
    anteriorConcluido = concluido
    return { ...m, desbloqueado, concluido }
  })

  const total = TRILHA.length
  const feitos = concluidos.size
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0
  const proximo = estado.find((m) => m.desbloqueado && !m.concluido)

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-7 w-7" /> Treinamento do sistema
        </h1>
        <p className="text-muted-foreground">
          Trilha guiada do ecossistema Sistenge. Cada módulo abre após a conclusão do anterior.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Seu progresso</CardTitle>
            <span className="text-sm font-semibold">{feitos}/{total} ({pct}%)</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-status-regular transition-all" style={{ width: `${pct}%` }} />
          </div>
          {proximo ? (
            <Link href={`/treinamento/${proximo.slug}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <PlayCircle className="h-4 w-4" /> Continuar: {proximo.titulo}
            </Link>
          ) : (
            <p className="text-sm text-status-regular font-medium">Trilha concluída! 🎉</p>
          )}
        </CardContent>
      </Card>

      {SECOES_TRILHA.map((secao) => {
        const mods = estado.filter((m) => m.secao === secao)
        if (mods.length === 0) return null
        return (
          <div key={secao} className="space-y-2">
            <h2 className="text-lg font-semibold pt-2">{secao}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {mods.map((m) => {
                const conteudo = (
                  <Card className={m.desbloqueado ? "h-full transition-colors hover:border-primary" : "h-full opacity-70"}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {m.concluido ? <CheckCircle2 className="h-5 w-5 text-status-regular" />
                            : m.desbloqueado ? <PlayCircle className="h-5 w-5 text-primary" />
                            : <Lock className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{m.ordem}. {m.titulo}</CardTitle>
                          <CardDescription className="mt-1">{m.objetivo}</CardDescription>
                        </div>
                        {m.concluido && <Badge variant="regular">Concluído</Badge>}
                        {!m.concluido && m.desbloqueado && <Badge variant="outline">Disponível</Badge>}
                        {!m.desbloqueado && <Badge variant="secondary">Bloqueado</Badge>}
                      </div>
                    </CardHeader>
                  </Card>
                )
                return m.desbloqueado
                  ? <Link key={m.slug} href={`/treinamento/${m.slug}`}>{conteudo}</Link>
                  : <div key={m.slug} title="Conclua o módulo anterior para desbloquear">{conteudo}</div>
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

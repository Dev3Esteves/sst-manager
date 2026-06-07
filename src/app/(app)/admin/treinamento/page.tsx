import { redirect } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, GraduationCap, CheckCircle2, AlertTriangle } from "lucide-react"
import { TRILHA } from "@/lib/treinamento/trilha"

export const dynamic = "force-dynamic"

// Total de módulos que contam como "treinamento do sistema".
const MODULOS = TRILHA
const TOTAL = MODULOS.length

export default async function ControleTreinamentoPage() {
  const r = await checkRole(["admin"])
  if (r.status === "unauth") redirect("/login")
  if (r.status === "forbidden") {
    return (
      <div className="container py-8">
        <Card className="border-status-alerta">
          <CardContent className="flex items-start gap-3 py-6">
            <ShieldAlert className="h-5 w-5 text-status-alerta shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Acesso restrito</p>
              <p className="text-sm text-muted-foreground mt-1">
                Apenas administradores podem ver o controle de treinamento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Service-role: lê todos os usuários e todo o progresso (a página já é admin-only).
  const admin = createAdminClient()
  const [usuariosResult, authResult, progressoResult] = await Promise.all([
    admin.from("usuarios")
      .select("id, ativo, perfis_acesso(nome), colaboradores(nome_completo)")
      .order("created_at", { ascending: false })
      .range(0, 999),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("treinamento_sistema_progresso").select("usuario_id, modulo_slug, concluido_em"),
  ])

  const emailPorId = new Map<string, string | undefined>()
  for (const u of authResult?.data?.users ?? []) emailPorId.set(u.id, u.email)

  // Agrupa progresso por usuário.
  const progressoPorUsuario = new Map<string, Set<string>>()
  for (const p of progressoResult.data ?? []) {
    const set = progressoPorUsuario.get(p.usuario_id) ?? new Set<string>()
    set.add(p.modulo_slug)
    progressoPorUsuario.set(p.usuario_id, set)
  }

  type Row = {
    id: string
    email: string
    colaborador: string | null
    perfil: string | null
    ativo: boolean
    feitos: number
    pendentes: string[]
    concluiu: boolean
  }

  const rows: Row[] = (usuariosResult.data ?? []).map((u) => {
    const perfil = Array.isArray(u.perfis_acesso) ? u.perfis_acesso[0] : u.perfis_acesso
    const colab = Array.isArray(u.colaboradores) ? u.colaboradores[0] : u.colaboradores
    const feitosSet = progressoPorUsuario.get(u.id) ?? new Set<string>()
    const pendentes = MODULOS.filter((m) => !feitosSet.has(m.slug)).map((m) => m.titulo)
    const feitos = TOTAL - pendentes.length
    return {
      id: u.id,
      email: emailPorId.get(u.id) ?? "(sem e-mail)",
      colaborador: colab?.nome_completo ?? null,
      perfil: perfil?.nome ?? null,
      ativo: u.ativo,
      feitos,
      pendentes,
      concluiu: pendentes.length === 0,
    }
  })

  const ativos = rows.filter((r) => r.ativo)
  const completos = ativos.filter((r) => r.concluiu).length
  const pctMedio = ativos.length > 0
    ? Math.round(ativos.reduce((acc, r) => acc + r.feitos, 0) / (ativos.length * TOTAL) * 100)
    : 0

  // Pendência por módulo (entre usuários ativos).
  const pendentesPorModulo = MODULOS.map((m) => ({
    titulo: m.titulo,
    pendentes: ativos.filter((r) => r.pendentes.includes(m.titulo)).length,
  })).sort((a, b) => b.pendentes - a.pendentes)

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-7 w-7" /> Controle de treinamento
        </h1>
        <p className="text-muted-foreground">
          Acompanhe a conclusão da trilha por usuário. Usuários precisam concluir o treinamento de cada módulo para liberar o uso.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Usuários ativos</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{ativos.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Trilha concluída</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{completos}<span className="text-base font-normal text-muted-foreground">/{ativos.length}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Conclusão média</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{pctMedio}%</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Por usuário</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-center">Progresso</TableHead>
                <TableHead>Módulos pendentes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const pct = Math.round((row.feitos / TOTAL) * 100)
                return (
                  <TableRow key={row.id} className={row.ativo ? "" : "opacity-50"}>
                    <TableCell>
                      <div className="font-medium">{row.email}</div>
                      {!row.ativo && <span className="text-[11px] text-muted-foreground">inativo</span>}
                    </TableCell>
                    <TableCell>{row.colaborador ?? "—"}</TableCell>
                    <TableCell>{row.perfil ? <Badge variant="outline">{row.perfil}</Badge> : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.concluiu
                          ? <CheckCircle2 className="h-4 w-4 text-status-regular shrink-0" />
                          : <AlertTriangle className="h-4 w-4 text-status-alerta shrink-0" />}
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-status-regular" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums">{row.feitos}/{TOTAL}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.pendentes.length === 0
                        ? <span className="text-xs text-status-regular">Tudo concluído</span>
                        : (
                          <div className="flex flex-wrap gap-1">
                            {row.pendentes.slice(0, 4).map((t) => <Badge key={t} variant="secondary" className="text-[10px] font-normal">{t}</Badge>)}
                            {row.pendentes.length > 4 && <span className="text-[11px] text-muted-foreground">+{row.pendentes.length - 4}</span>}
                          </div>
                        )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum usuário.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pendências por módulo (usuários ativos)</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {pendentesPorModulo.map((m) => (
              <div key={m.titulo} className="flex items-center justify-between p-2.5 text-sm">
                <span>{m.titulo}</span>
                <Badge variant={m.pendentes === 0 ? "regular" : "alerta"}>
                  {m.pendentes === 0 ? "ok" : `${m.pendentes} pendente(s)`}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

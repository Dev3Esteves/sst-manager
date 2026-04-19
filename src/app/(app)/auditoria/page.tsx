import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { History, ShieldAlert } from "lucide-react"

function acaoVariant(acao: string | null): BadgeProps["variant"] {
  switch (acao) {
    case "INSERT": return "regular"
    case "UPDATE": return "alerta"
    case "DELETE": return "vencido"
    default: return "secondary"
  }
}

export default async function AuditoriaPage() {
  const supabase = await createClient()

  // Validação: só admin vê
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
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

  const { data: perfilRow } = await supabase.rpc("user_perfil_nome")
  const ehAdmin = typeof perfilRow === "string" && perfilRow === "admin"

  const { data: logs } = await supabase
    .from("audit_log")
    .select("id, tabela, registro_id, acao, usuario_id, dados_anteriores, dados_novos, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const { count: total } = await supabase
    .from("audit_log")
    .select("*", { count: "exact", head: true })

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground">
          Log de alterações (LGPD Art. 37) — últimas 200 ações. Total: {total ?? 0}.
        </p>
      </div>

      {!ehAdmin && (
        <Card className="border-status-alerta">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <ShieldAlert className="h-5 w-5 text-status-alerta shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Somente administradores veem o log completo</p>
              <p className="text-muted-foreground mt-1">
                A tabela abaixo está filtrada pelo RLS. Se você é admin, faça logout e login novamente para refrescar o perfil.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            {logs?.length ?? 0} evento(s)
          </CardTitle>
          <CardDescription>
            Cada alteração de colaboradores, exames, treinamentos, documentos, ocorrências, inspeções, EPIs e usuários é registrada aqui automaticamente via trigger SQL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/hora</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Campos alterados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => {
                const diff = computeDiff(log.dados_anteriores, log.dados_novos, log.acao)
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.tabela}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={acaoVariant(log.acao)}>{log.acao}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {log.registro_id?.slice(0, 8) ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {log.usuario_id?.slice(0, 8) ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-xs text-muted-foreground truncate" title={diff}>
                        {diff || "—"}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Sem eventos de auditoria ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function computeDiff(
  anteriores: unknown,
  novos: unknown,
  acao: string | null,
): string {
  if (acao === "INSERT") {
    const data = novos as Record<string, unknown> | null
    if (!data) return ""
    const fields = Object.keys(data).filter((k) => !["id", "created_at", "updated_at"].includes(k))
    return `+ ${fields.slice(0, 5).join(", ")}${fields.length > 5 ? "..." : ""}`
  }
  if (acao === "DELETE") {
    return "(registro removido)"
  }
  if (acao === "UPDATE") {
    const a = anteriores as Record<string, unknown> | null
    const n = novos as Record<string, unknown> | null
    if (!a || !n) return ""
    const changed: string[] = []
    for (const key of Object.keys(n)) {
      if (["updated_at"].includes(key)) continue
      if (JSON.stringify(a[key]) !== JSON.stringify(n[key])) {
        changed.push(key)
      }
    }
    return changed.slice(0, 6).join(", ") + (changed.length > 6 ? "..." : "")
  }
  return ""
}

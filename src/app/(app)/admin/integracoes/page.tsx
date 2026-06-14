import { redirect } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldAlert, Webhook, CheckCircle2, AlertTriangle, Info } from "lucide-react"

export const dynamic = "force-dynamic"

const TZ = "America/Sao_Paulo"
function fmtDataHora(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("pt-BR", { timeZone: TZ })
}

type Evento = {
  event_id: string
  tipo: string
  status: "processado" | "erro"
  detalhe: string | null
  recebido_em: string
}

export default async function IntegracoesPage() {
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
                Apenas administradores podem ver o monitor de integração.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // integr_evento é deny-all (RLS): leitura via service role. A página já é admin-only.
  const admin = createAdminClient()
  const { data: eventos, error } = await admin
    .from("integr_evento")
    .select("event_id, tipo, status, detalhe, recebido_em")
    .order("recebido_em", { ascending: false })
    .range(0, 299)
    .returns<Evento[]>()

  const lista = eventos ?? []
  const erros = lista.filter((e) => e.status === "erro")
  const processados = lista.length - erros.length

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Webhook className="h-7 w-7" /> Integração — Sistenge People
        </h1>
        <p className="text-muted-foreground">
          Eventos recebidos do People (cargos e colaboradores) via webhook. O People é a fonte;
          o SST aplica cada evento de forma idempotente.
        </p>
      </div>

      <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm flex gap-2">
        <Info className="h-5 w-5 text-sky-600 shrink-0" />
        <span className="text-sky-900">
          Esta lista mostra apenas eventos que <b>passaram pela autenticação e pela validação do
          envelope</b>. Eventos rejeitados por <b>assinatura inválida (401)</b>, <b>JSON malformado
          (400)</b> ou <b>envelope inválido (422)</b> — ex.: envio em lote/array, que não é suportado —
          <b>não aparecem aqui</b>; verifique os logs do servidor (rota{" "}
          <code>integr/people/webhook</code>). O webhook processa <b>um registro por evento</b> (não há
          evento de lote). Já um <b>erro de dados</b> (ex.: empresa não cadastrada) aparece abaixo como
          evento com status <b>erro</b>.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Eventos recebidos</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{lista.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Processados</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-status-regular">{processados}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Com erro</CardTitle></CardHeader>
          <CardContent className={`text-2xl font-bold ${erros.length > 0 ? "text-status-vencido" : ""}`}>{erros.length}</CardContent>
        </Card>
      </div>

      {erros.length > 0 && (
        <Card className="border-status-vencido/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-vencido" /> Eventos com erro ({erros.length})
            </CardTitle>
            <CardDescription>
              Causa comum: <b>empresa não encontrada</b> (CNPJ do registro não cadastrado no SST) ou
              dado obrigatório ausente. Corrija a origem e reenvie pelo People.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Recebido</TableHead>
                  <TableHead className="w-48">Tipo</TableHead>
                  <TableHead>Detalhe do erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {erros.map((e) => (
                  <TableRow key={e.event_id}>
                    <TableCell className="text-xs tabular-nums">{fmtDataHora(e.recebido_em)}</TableCell>
                    <TableCell><Badge variant="outline">{e.tipo}</Badge></TableCell>
                    <TableCell className="text-xs text-status-vencido">{e.detalhe ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos recebidos (últimos {lista.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Recebido</TableHead>
                <TableHead className="w-48">Tipo</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((e) => (
                <TableRow key={e.event_id}>
                  <TableCell className="text-xs tabular-nums">{fmtDataHora(e.recebido_em)}</TableCell>
                  <TableCell><Badge variant="outline">{e.tipo}</Badge></TableCell>
                  <TableCell>
                    {e.status === "processado" ? (
                      <Badge variant="regular" className="gap-1"><CheckCircle2 className="h-3 w-3" /> ok</Badge>
                    ) : (
                      <Badge variant="vencido" className="gap-1"><AlertTriangle className="h-3 w-3" /> erro</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.detalhe ?? "—"}</TableCell>
                </TableRow>
              ))}
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    {error ? (
                      <span className="text-destructive" role="alert">
                        Não foi possível carregar os eventos de integração. Recarregue a página.
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Nenhum evento recebido do People ainda. Se você esperava dados, o problema está
                        antes da aplicação: URL do webhook, segredo (assinatura) ou formato do envio —
                        verifique os logs do servidor.
                      </span>
                    )}
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

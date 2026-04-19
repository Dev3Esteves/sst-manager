import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/vencimento"
import { Plus, MessageSquare, Users } from "lucide-react"

export default async function DDSPage() {
  const supabase = await createClient()
  const { data: dds } = await supabase
    .from("documentos_sst")
    .select("id, titulo, data_emissao, local_trabalho, conteudo, status, empresas(razao_social)")
    .eq("tipo", "dialogo_seguranca")
    .order("data_emissao", { ascending: false })
    .limit(100)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-7 w-7" />
            DDS — Diálogo Diário de Segurança
          </h1>
          <p className="text-muted-foreground">
            Registros diários de orientação de segurança com lista de presença e assinaturas.
          </p>
        </div>
        <Button asChild>
          <Link href="/dds/new"><Plus className="h-4 w-4" />Novo DDS</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dds?.length ?? 0} registro(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Mediador</TableHead>
                <TableHead className="text-center">Participantes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dds?.map((d) => {
                const c = d.conteudo as {
                  tema?: string
                  mediador_nome?: string
                  participantes?: unknown[]
                } | null
                const participantes = Array.isArray(c?.participantes) ? c.participantes.length : 0
                return (
                  <TableRow key={d.id} className="cursor-pointer">
                    <TableCell className="whitespace-nowrap">{formatDate(d.data_emissao)}</TableCell>
                    <TableCell>
                      <Link href={`/dds/${d.id}`} className="font-medium hover:underline">
                        {c?.tema ?? d.titulo}
                      </Link>
                    </TableCell>
                    <TableCell>{d.local_trabalho ?? "—"}</TableCell>
                    <TableCell>{c?.mediador_nome ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        <Users className="h-3 w-3 mr-1" />
                        {participantes}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="regular" className="capitalize">{d.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!dds || dds.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    <MessageSquare className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    Nenhum DDS registrado. Comece pelo primeiro diálogo da equipe.
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

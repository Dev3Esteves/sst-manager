import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, AlertCircle } from "lucide-react"
import {
  NC_ORIGEM_LABEL,
  NC_SEVERIDADE_LABEL,
  NC_STATUS_LABEL,
  type NcOrigem,
  type NcSeveridade,
  type NcStatus,
} from "@/lib/validations/nao-conformidade"

export const metadata = { title: "Não-Conformidades" }

type NcRow = {
  id: string
  numero_sequencial: number
  titulo: string
  origem: NcOrigem
  severidade: NcSeveridade
  status: NcStatus
  data_identificacao: string
  obras: { nome: string } | { nome: string }[] | null
}

const SEVERIDADE_BADGE: Record<NcSeveridade, "default" | "outline" | "alerta" | "critico"> = {
  baixa: "outline",
  media: "default",
  alta: "alerta",
  critica: "critico",
}

const STATUS_BADGE: Record<NcStatus, "default" | "outline" | "secondary"> = {
  aberta: "default",
  em_analise: "default",
  em_tratamento: "default",
  verificacao: "default",
  encerrada: "secondary",
  cancelada: "outline",
}

export default async function NaoConformidadesPage() {
  const supabase = await createClient()
  const { data: ncs, error } = await supabase
    .from("nao_conformidades")
    .select(`
      id, numero_sequencial, titulo, origem, severidade, status, data_identificacao,
      obras(nome)
    `)
    .order("data_identificacao", { ascending: false })
    .returns<NcRow[]>()

  const lista = ncs ?? []
  const abertas = lista.filter((n) => !["encerrada", "cancelada"].includes(n.status)).length
  const criticas = lista.filter((n) => n.severidade === "critica" && n.status !== "encerrada" && n.status !== "cancelada").length

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Não-Conformidades</h1>
          <p className="text-muted-foreground">
            Registro, análise de causa raiz e ações corretivas (ISO 45001 cl. 10.2).
          </p>
        </div>
        <Button asChild>
          <Link href="/nao-conformidades/new">
            <Plus className="h-4 w-4" />
            Nova NC
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lista.length}</div>
            <p className="text-xs text-muted-foreground">Total cadastradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{abertas}</div>
            <p className="text-xs text-muted-foreground">Em tratamento (não encerradas)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-status-critico flex items-center gap-2">
              {criticas > 0 && <AlertCircle className="h-5 w-5" />}
              {criticas}
            </div>
            <p className="text-xs text-muted-foreground">Críticas em aberto</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de não-conformidades</CardTitle>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            error ? (
              <p className="text-sm text-center py-8 text-destructive" role="alert">
                Não foi possível carregar as não-conformidades. Recarregue a página.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma não-conformidade cadastrada. Clique em <strong>Nova NC</strong> para começar.
              </p>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 font-mono">Nº</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-32">Origem</TableHead>
                  <TableHead className="w-24">Severidade</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-28">Identificada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((nc) => {
                  const obra = Array.isArray(nc.obras) ? nc.obras[0] : nc.obras
                  return (
                    <TableRow key={nc.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell className="font-mono text-xs">
                        <Link href={`/nao-conformidades/${nc.id}`} className="block">
                          NC-{String(nc.numero_sequencial).padStart(4, "0")}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/nao-conformidades/${nc.id}`} className="block">
                          <div className="font-medium">{nc.titulo}</div>
                          {obra && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Obra: {obra.nome}
                            </div>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {NC_ORIGEM_LABEL[nc.origem]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={SEVERIDADE_BADGE[nc.severidade]} className="text-[10px]">
                          {NC_SEVERIDADE_LABEL[nc.severidade]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[nc.status]} className="text-[10px]">
                          {NC_STATUS_LABEL[nc.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(nc.data_identificacao).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

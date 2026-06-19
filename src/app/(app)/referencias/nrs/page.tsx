import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils/vencimento"

export const metadata = { title: "Normas Regulamentadoras" }

export default async function NrCatalogPage() {
  const supabase = await createClient()
  const { data: nrs, error } = await supabase
    .from("nr_catalog")
    .select("numero, titulo, status, data_atualizacao, ementa, fonte_url")
    .order("numero")

  const vigentes = nrs?.filter((n) => n.status === "vigente").length ?? 0
  const revogadas = nrs?.filter((n) => n.status === "revogada").length ?? 0

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Normas Regulamentadoras</h1>
        <p className="text-muted-foreground">
          Catálogo oficial das NRs brasileiras. Fonte:{" "}
          <a
            href="https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            gov.br/trabalho-e-emprego <ExternalLink className="inline h-3 w-3" />
          </a>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {nrs?.length ?? 0} normas · {vigentes} vigentes · {revogadas} revogadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Atualizada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nrs?.map((nr) => (
                <TableRow key={nr.numero} className="cursor-pointer hover:bg-accent/50">
                  <TableCell className="font-mono font-medium">
                    <Link href={`/referencias/nrs/${nr.numero}`} className="block">
                      NR-{nr.numero}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/referencias/nrs/${nr.numero}`} className="block">
                      <div className="font-medium">{nr.titulo}</div>
                      {nr.ementa && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {nr.ementa}
                        </div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {nr.status === "vigente" ? (
                      <Badge variant="outline" className="text-[10px]">vigente</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">revogada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {nr.data_atualizacao
                      ? formatDate(nr.data_atualizacao)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {(!nrs || nrs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {error ? (
                      <span className="text-destructive" role="alert">Não foi possível carregar o catálogo de NRs. Recarregue a página.</span>
                    ) : (
                      <>Catálogo vazio. Execute <code className="text-xs">node scripts/seed-referencias-nr.mjs</code>.</>
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

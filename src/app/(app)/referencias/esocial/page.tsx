import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink, AlertTriangle } from "lucide-react"
import { ESOCIAL_GRUPO_LABEL, type EsocialGrupo } from "@/lib/validations/pgr"

export const metadata = { title: "Tabela 24 — Agentes Nocivos eSocial" }

type AgenteRow = {
  codigo: string
  descricao: string
  grupo: EsocialGrupo
  exige_aposentadoria_especial: boolean
  limite_tolerancia: string | null
  observacao: string | null
  versao_leiaute: string
  ativo: boolean
}

const GRUPO_BADGE: Record<EsocialGrupo, "default" | "outline" | "secondary" | "alerta" | "critico"> = {
  fisico: "default",
  quimico: "alerta",
  biologico: "critico",
  associacao: "secondary",
  ausencia: "outline",
}

export default async function EsocialCatalogPage() {
  const supabase = await createClient()
  const { data: agentes } = await supabase
    .from("esocial_agente_nocivo")
    .select(
      "codigo, descricao, grupo, exige_aposentadoria_especial, limite_tolerancia, observacao, versao_leiaute, ativo",
    )
    .order("codigo")
    .returns<AgenteRow[]>()

  const lista = agentes ?? []
  const porGrupo = lista.reduce<Record<string, number>>((acc, a) => {
    acc[a.grupo] = (acc[a.grupo] ?? 0) + 1
    return acc
  }, {})
  const aposEsp = lista.filter((a) => a.exige_aposentadoria_especial).length
  const versao = lista[0]?.versao_leiaute ?? "—"

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tabela 24 — Agentes Nocivos eSocial
        </h1>
        <p className="text-muted-foreground">
          Catálogo de códigos para o evento <span className="font-mono">S-2240</span>{" "}
          (Condições Ambientais do Trabalho). Fonte:{" "}
          <a
            href="https://www.gov.br/esocial/pt-br/documentacao-tecnica/tabelas"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            gov.br/esocial <ExternalLink className="inline h-3 w-3" />
          </a>
          {" · "}Leiaute <span className="font-mono">{versao}</span>
        </p>
      </div>

      {lista.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-amber-700 dark:text-amber-300">
              Catálogo em pré-validação.
            </strong>{" "}
            Os códigos foram montados a partir das convenções pré-eSocial PPP e
            do precedente SISTENGE (PGR_GAROA). Confira cada linha contra o
            <strong> Anexo II oficial</strong> do leiaute S-1.3 antes de submeter
            S-2240 em produção. Detalhes da pesquisa em{" "}
            <code className="text-xs">docs/research/esocial-tabela24-fontes.md</code>.
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lista.length}</div>
            <p className="text-xs text-muted-foreground">Códigos no catálogo</p>
          </CardContent>
        </Card>
        {(["fisico", "quimico", "biologico", "ausencia"] as const).map((g) => (
          <Card key={g}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{porGrupo[g] ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {ESOCIAL_GRUPO_LABEL[g]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Agentes nocivos ({lista.length}) · {aposEsp} com aposentadoria especial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Catálogo vazio. Execute{" "}
              <code className="text-xs">node scripts/seed-esocial-tabela24.mjs</code>.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 font-mono">Código</TableHead>
                  <TableHead className="w-28">Grupo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-40">Limite / Norma</TableHead>
                  <TableHead className="w-32 text-center">Aposentadoria especial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((a) => (
                  <TableRow key={a.codigo} className="hover:bg-accent/50">
                    <TableCell className="font-mono text-xs">{a.codigo}</TableCell>
                    <TableCell>
                      <Badge variant={GRUPO_BADGE[a.grupo]} className="text-[10px]">
                        {ESOCIAL_GRUPO_LABEL[a.grupo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{a.descricao}</div>
                      {a.observacao && (
                        <div className="text-xs text-muted-foreground italic mt-0.5 line-clamp-2">
                          {a.observacao}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.limite_tolerancia ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {a.exige_aposentadoria_especial ? (
                        <Badge variant="alerta" className="text-[10px]">Sim</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

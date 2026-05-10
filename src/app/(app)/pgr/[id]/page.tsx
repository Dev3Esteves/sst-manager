import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Pencil, FileDown, Users } from "lucide-react"
import {
  PGR_STATUS_LABEL,
  RISCO_CATEGORIA_LABEL,
  CATEGORIA_RISCO_LABEL,
  ACAO_STATUS_LABEL,
  type PgrStatus,
  type RiscoCategoria,
  type CategoriaRisco,
  type AcaoStatus,
} from "@/lib/validations/pgr"

type Pgr = {
  id: string
  obra_id: string
  numero_revisao: number
  descricao_revisao: string | null
  data_emissao: string
  data_vencimento: string
  status: PgrStatus
  responsavel_elaboracao_nome: string | null
  responsavel_elaboracao_funcao: string | null
  responsavel_elaboracao_crea: string | null
  responsavel_obra_nome: string | null
  responsavel_obra_funcao: string | null
  responsavel_obra_crea: string | null
  cno_obra_snapshot: string | null
  num_empregados_snapshot: number | null
  codigo_formulario: string
  arquivo_pdf_url: string | null
  obras: {
    nome: string
    codigo: string | null
    cno: string | null
    num_empregados_max: number | null
    cidade: string | null
    uf: string | null
    empresa: { razao_social: string } | { razao_social: string }[] | null
    contratante: { razao_social: string } | { razao_social: string }[] | null
  }
}

type Ghe = {
  id: string
  codigo: string
  descricao: string
  funcao_posicao: string | null
  local_trabalho: string | null
  num_empregados_expostos: number | null
}

type Risco = {
  id: string
  pgr_ghe_id: string
  categoria: RiscoCategoria
  agente_ambiental: string
  categoria_risco: CategoriaRisco | null
}

type Acao = {
  id: string
  numero_item: number
  o_que: string
  quem: string | null
  status: AcaoStatus
}

function statusVariant(status: PgrStatus): "default" | "secondary" | "outline" | "vencido" {
  switch (status) {
    case "vigente": return "default"
    case "rascunho": return "outline"
    case "superseded": return "secondary"
    case "vencido": return "vencido"
  }
}

function categoriaRiscoVariant(c: CategoriaRisco | null): "default" | "outline" | "alerta" | "critico" {
  switch (c) {
    case "muito_alto": return "critico"
    case "alto": return "alerta"
    case "medio": return "default"
    default: return "outline"
  }
}

export default async function PgrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pgr } = await supabase
    .from("pgr")
    .select(`
      id, obra_id, numero_revisao, descricao_revisao, data_emissao, data_vencimento, status,
      responsavel_elaboracao_nome, responsavel_elaboracao_funcao, responsavel_elaboracao_crea,
      responsavel_obra_nome, responsavel_obra_funcao, responsavel_obra_crea,
      cno_obra_snapshot, num_empregados_snapshot, codigo_formulario, arquivo_pdf_url,
      obras!inner(
        nome, codigo, cno, num_empregados_max, cidade, uf,
        empresa:empresas!obras_empresa_id_fkey(razao_social),
        contratante:empresas!obras_contratante_id_fkey(razao_social)
      )
    `)
    .eq("id", id)
    .single<Pgr>()

  if (!pgr) notFound()

  const [{ data: ghes }, { data: riscos }, { data: acoes }] = await Promise.all([
    supabase
      .from("pgr_ghe")
      .select("id, codigo, descricao, funcao_posicao, local_trabalho, num_empregados_expostos")
      .eq("pgr_id", id)
      .order("ordem")
      .order("codigo")
      .returns<Ghe[]>(),
    supabase
      .from("pgr_risco")
      .select("id, pgr_ghe_id, categoria, agente_ambiental, categoria_risco")
      .eq("pgr_id", id)
      .returns<Risco[]>(),
    supabase
      .from("pgr_acao")
      .select("id, numero_item, o_que, quem, status")
      .eq("pgr_id", id)
      .order("numero_item")
      .returns<Acao[]>(),
  ])

  const obra = pgr.obras
  const empresa = Array.isArray(obra.empresa) ? obra.empresa[0] : obra.empresa
  const contratante = Array.isArray(obra.contratante) ? obra.contratante[0] : obra.contratante

  const ghesList = ghes ?? []
  const riscosList = riscos ?? []
  const acoesList = acoes ?? []

  const riscosCriticos = riscosList.filter(
    (r) => r.categoria_risco === "alto" || r.categoria_risco === "muito_alto",
  ).length

  return (
    <div className="container py-8 space-y-6 max-w-5xl">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
          <Link href="/pgr">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">PGR</h1>
              <Badge variant="outline" className="font-mono">
                Rev. {String(pgr.numero_revisao).padStart(2, "0")}
              </Badge>
              <Badge variant={statusVariant(pgr.status)}>{PGR_STATUS_LABEL[pgr.status]}</Badge>
            </div>
            <h2 className="text-xl text-muted-foreground">
              {obra.nome}
              {obra.codigo ? ` (${obra.codigo})` : ""}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vigência: {new Date(pgr.data_emissao).toLocaleDateString("pt-BR")} →{" "}
              {new Date(pgr.data_vencimento).toLocaleDateString("pt-BR")} ·{" "}
              <span className="font-mono">{pgr.codigo_formulario}</span>
            </p>
            {pgr.descricao_revisao && (
              <p className="text-sm italic text-muted-foreground mt-1">
                &ldquo;{pgr.descricao_revisao}&rdquo;
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {pgr.arquivo_pdf_url ? (
              <Button asChild>
                <a href={pgr.arquivo_pdf_url} target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4" />
                  Baixar PDF
                </a>
              </Button>
            ) : (
              <Button disabled title="Gerador de PDF em desenvolvimento">
                <FileDown className="h-4 w-4" />
                Gerar PDF
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/pgr/${pgr.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Caracterização</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Empresa contratada:</span>{" "}
            <span className="font-medium">{empresa?.razao_social ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cliente (obra):</span>{" "}
            <span className="font-medium">{contratante?.razao_social ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">CNO:</span>{" "}
            <span className="font-mono">{pgr.cno_obra_snapshot ?? obra.cno ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Localização:</span>{" "}
            {obra.cidade ?? "—"}
            {obra.uf ? ` / ${obra.uf}` : ""}
          </div>
          <div>
            <span className="text-muted-foreground">Máx. empregados:</span>{" "}
            {pgr.num_empregados_snapshot ?? obra.num_empregados_max ?? "—"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responsáveis técnicos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
              Elaboração SST
            </div>
            <div className="font-medium">{pgr.responsavel_elaboracao_nome ?? "—"}</div>
            <div className="text-muted-foreground">{pgr.responsavel_elaboracao_funcao ?? ""}</div>
            <div className="text-muted-foreground font-mono text-xs">
              {pgr.responsavel_elaboracao_crea ?? ""}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
              Coordenação da obra
            </div>
            <div className="font-medium">{pgr.responsavel_obra_nome ?? "—"}</div>
            <div className="text-muted-foreground">{pgr.responsavel_obra_funcao ?? ""}</div>
            <div className="text-muted-foreground font-mono text-xs">
              {pgr.responsavel_obra_crea ?? ""}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{ghesList.length}</div>
            <p className="text-xs text-muted-foreground">GHEs cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{riscosList.length}</div>
            <p className="text-xs text-muted-foreground">Riscos inventariados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{riscosCriticos}</div>
            <p className="text-xs text-muted-foreground">Riscos alto/muito alto</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{acoesList.length}</div>
            <p className="text-xs text-muted-foreground">Ações no cronograma</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Grupos Homogêneos de Exposição (GHE)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ghesList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum GHE cadastrado. O editor de GHEs é o próximo passo do módulo.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Função / Posição</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="w-24 text-right">Expostos</TableHead>
                  <TableHead className="w-20 text-right">Riscos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ghesList.map((g) => {
                  const riscosGhe = riscosList.filter((r) => r.pgr_ghe_id === g.id).length
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-mono font-medium">{g.codigo}</TableCell>
                      <TableCell>{g.descricao}</TableCell>
                      <TableCell className="text-sm">{g.funcao_posicao ?? "—"}</TableCell>
                      <TableCell className="text-sm">{g.local_trabalho ?? "—"}</TableCell>
                      <TableCell className="text-right">{g.num_empregados_expostos ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-[10px]">{riscosGhe}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {riscosList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de riscos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {(Object.keys(RISCO_CATEGORIA_LABEL) as RiscoCategoria[]).map((cat) => {
                const count = riscosList.filter((r) => r.categoria === cat).length
                return (
                  <div key={cat} className="rounded-md border p-3">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">{RISCO_CATEGORIA_LABEL[cat]}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(CATEGORIA_RISCO_LABEL) as CategoriaRisco[]).reverse().map((c) => {
                const count = riscosList.filter((r) => r.categoria_risco === c).length
                if (count === 0) return null
                return (
                  <Badge key={c} variant={categoriaRiscoVariant(c)}>
                    {CATEGORIA_RISCO_LABEL[c]}: {count}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano de Ação (5W1H — Anexo I)</CardTitle>
        </CardHeader>
        <CardContent>
          {acoesList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma ação cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>O que fazer</TableHead>
                  <TableHead className="w-32">Quem</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acoesList.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.numero_item}</TableCell>
                    <TableCell className="text-sm">{a.o_que}</TableCell>
                    <TableCell className="text-sm">{a.quem ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {ACAO_STATUS_LABEL[a.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong>Próximas funcionalidades:</strong> editor inline de GHEs/riscos/ações/medidas/EPIs e
        gerador de PDF fidedigno ao formulário FO-121-00. Migration 0012 já criou todas as tabelas
        necessárias; a UI completa entra no próximo chunk.
      </div>
    </div>
  )
}

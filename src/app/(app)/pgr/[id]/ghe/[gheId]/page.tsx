import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Plus } from "lucide-react"
import { GheForm } from "../ghe-form"
import { updateGhe, deleteGhe } from "../actions"
import { CargosEditor } from "./cargos-editor"
import { ImportarEquipeButton } from "./importar-equipe-button"
import {
  RISCO_CATEGORIA_LABEL,
  CATEGORIA_RISCO_LABEL,
  EPI_USO_LABEL,
  type RiscoCategoria,
  type CategoriaRisco,
  type EpiUso,
} from "@/lib/validations/pgr"

type RiscoRow = {
  id: string
  categoria: RiscoCategoria
  agente_ambiental: string
  codigo_esocial: string | null
  tipo_exposicao: string | null
  categoria_risco: CategoriaRisco | null
  ordem: number
}

type EpiRow = {
  id: string
  epi_nome: string
  epi_id: string | null
  uso: EpiUso
  observacao: string | null
  ordem: number
}

function categoriaRiscoVariant(c: CategoriaRisco | null): "default" | "outline" | "alerta" | "critico" {
  switch (c) {
    case "muito_alto": return "critico"
    case "alto": return "alerta"
    case "medio": return "default"
    default: return "outline"
  }
}

export default async function EditGhePage({
  params,
}: {
  params: Promise<{ id: string; gheId: string }>
}) {
  const { id: pgrId, gheId } = await params
  const supabase = await createClient()

  const [{ data: ghe }, { data: cargos }, { data: pgr }, { data: riscos }, { data: epis }] = await Promise.all([
    supabase.from("pgr_ghe").select("*").eq("id", gheId).single(),
    supabase
      .from("pgr_ghe_cargo")
      .select("id, cargo_titulo, cargo_id")
      .eq("pgr_ghe_id", gheId)
      .order("ordem")
      .order("cargo_titulo"),
    supabase
      .from("pgr")
      .select("numero_revisao, obra_id, obras(nome)")
      .eq("id", pgrId)
      .single(),
    supabase
      .from("pgr_risco")
      .select("id, categoria, agente_ambiental, codigo_esocial, tipo_exposicao, categoria_risco, ordem")
      .eq("pgr_ghe_id", gheId)
      .order("ordem")
      .order("agente_ambiental")
      .returns<RiscoRow[]>(),
    supabase
      .from("pgr_epi_ghe")
      .select("id, epi_nome, epi_id, uso, observacao, ordem")
      .eq("pgr_ghe_id", gheId)
      .order("ordem")
      .order("epi_nome")
      .returns<EpiRow[]>(),
  ])

  if (!ghe || !pgr) notFound()

  const { count: equipeCount } = pgr.obra_id
    ? await supabase
        .from("obra_equipe")
        .select("id", { count: "exact", head: true })
        .eq("obra_id", pgr.obra_id)
    : { count: 0 }

  const obra = Array.isArray(pgr.obras) ? pgr.obras[0] : pgr.obras
  const riscosList = riscos ?? []
  const episList = epis ?? []

  async function handleDelete() {
    "use server"
    return deleteGhe(gheId, pgrId)
  }

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <p className="text-sm text-muted-foreground">
        PGR de <span className="font-medium">{obra?.nome}</span> · Rev.{" "}
        {String(pgr.numero_revisao).padStart(2, "0")}
      </p>

      <GheForm
        pgrId={pgrId}
        ghe={ghe}
        action={updateGhe.bind(null, gheId)}
        onDelete={handleDelete}
        modo="editar"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cargos vinculados ao GHE</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Liste os cargos/funções que pertencem a este GHE (Anexo II). Mesmo cargo
            pode aparecer em vários GHEs entre obras. Persistência é imediata —
            adicione e remova sem precisar salvar o formulário.
          </p>
          {(equipeCount ?? 0) > 0 && (
            <ImportarEquipeButton gheId={gheId} pgrId={pgrId} equipeCount={equipeCount ?? 0} />
          )}
          <CargosEditor gheId={gheId} pgrId={pgrId} cargos={cargos ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            Riscos inventariados ({riscosList.length})
          </CardTitle>
          <Button size="sm" asChild>
            <Link href={`/pgr/${pgrId}/ghe/${gheId}/risco/new`}>
              <Plus className="h-4 w-4" />
              Novo risco
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {riscosList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum risco inventariado para este GHE. Adicione os agentes ambientais
              (Anexo III) clicando em <strong>Novo risco</strong>.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Categoria</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead className="w-28 font-mono">Cód. eSocial</TableHead>
                  <TableHead className="w-24">Exposição</TableHead>
                  <TableHead className="w-24">Risco final</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riscosList.map((r) => (
                  <TableRow key={r.id} className="hover:bg-accent/50">
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {RISCO_CATEGORIA_LABEL[r.categoria]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/pgr/${pgrId}/ghe/${gheId}/risco/${r.id}`}
                        className="hover:underline"
                      >
                        {r.agente_ambiental}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.codigo_esocial ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">{r.tipo_exposicao ?? "—"}</TableCell>
                    <TableCell>
                      {r.categoria_risco ? (
                        <Badge variant={categoriaRiscoVariant(r.categoria_risco)} className="text-[10px]">
                          {CATEGORIA_RISCO_LABEL[r.categoria_risco]}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/pgr/${pgrId}/ghe/${gheId}/risco/${r.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            EPIs do GHE ({episList.length})
          </CardTitle>
          <Button size="sm" asChild>
            <Link href={`/pgr/${pgrId}/ghe/${gheId}/epi/new`}>
              <Plus className="h-4 w-4" />
              Novo EPI
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {episList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum EPI vinculado a este GHE (Anexo VII). Linkar EPIs cadastrados em
              /epis facilita reuso e mantém CA consistente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EPI</TableHead>
                  <TableHead className="w-32">Uso</TableHead>
                  <TableHead className="w-32">Cadastrado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episList.map((e) => (
                  <TableRow key={e.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">
                      <Link
                        href={`/pgr/${pgrId}/ghe/${gheId}/epi/${e.id}`}
                        className="hover:underline"
                      >
                        {e.epi_nome}
                      </Link>
                      {e.observacao && (
                        <div className="text-xs text-muted-foreground italic line-clamp-1">
                          {e.observacao}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {EPI_USO_LABEL[e.uso]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.epi_id ? "Sim" : "Livre"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/pgr/${pgrId}/ghe/${gheId}/epi/${e.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
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

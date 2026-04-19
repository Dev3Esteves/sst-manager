import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCPF } from "@/lib/validations/shared"
import { EmpresaBadge } from "@/components/empresa-badge"
import { Plus, Pencil, FileSpreadsheet, HardHat } from "lucide-react"

export default async function ColaboradoresPage() {
  const supabase = await createClient()
  const { data: colaboradores } = await supabase
    .from("colaboradores")
    .select(`
      id, nome_completo, cpf, tipo_vinculo, status, matricula, data_admissao,
      empresa_id,
      empresas(razao_social),
      cargos(titulo),
      obras:obra_id(nome)
    `)
    .order("nome_completo")

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground">Cadastro de empregados próprios e terceiros.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/colaboradores/importar">
              <FileSpreadsheet className="h-4 w-4" />
              Importar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/colaboradores/new">
              <Plus className="h-4 w-4" />
              Novo colaborador
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{colaboradores?.length ?? 0} colaborador(es)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Cargo / Obra</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradores?.map((c) => {
                const empresa = Array.isArray(c.empresas) ? c.empresas[0] : c.empresas
                const cargo = Array.isArray(c.cargos) ? c.cargos[0] : c.cargos
                const obra = Array.isArray(c.obras) ? c.obras[0] : c.obras
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.nome_completo}</div>
                      {c.matricula && (
                        <div className="text-xs text-muted-foreground">Mat. {c.matricula}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatCPF(c.cpf)}</TableCell>
                    <TableCell>
                      <EmpresaBadge empresaId={c.empresa_id} nome={empresa?.razao_social ?? "—"} />
                    </TableCell>
                    <TableCell>
                      <div>{cargo?.titulo ?? "—"}</div>
                      {obra?.nome && (
                        <div className="text-xs text-muted-foreground">Obra: {obra.nome}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px]">{c.tipo_vinculo}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon" asChild
                          title="Baixar Ficha de EPI (histórico completo)"
                        >
                          <a
                            href={`/api/colaboradores/${c.id}/ficha-epi/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <HardHat className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Editar">
                          <Link href={`/colaboradores/${c.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!colaboradores || colaboradores.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum colaborador cadastrado.
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

function statusLabel(s: string | null) {
  return { ativo: "Ativo", afastado: "Afastado", ferias: "Férias", demitido: "Demitido" }[s ?? ""] ?? s
}
function statusVariant(s: string | null): BadgeProps["variant"] {
  switch (s) {
    case "ativo": return "regular"
    case "afastado": return "alerta"
    case "ferias": return "outline"
    case "demitido": return "vencido"
    default: return "secondary"
  }
}

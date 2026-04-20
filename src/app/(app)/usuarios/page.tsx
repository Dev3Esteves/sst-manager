import Link from "next/link"
import { redirect } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination, parsePageParam } from "@/components/pagination"
import { Plus, Pencil, ShieldAlert, UserCog } from "lucide-react"

const PER_PAGE = 25

function perfilVariant(nome: string | null): BadgeProps["variant"] {
  if (!nome) return "secondary"
  if (nome === "admin") return "vencido"
  if (nome === "engenheiro_seg") return "critico"
  if (nome === "tec_seguranca") return "alerta"
  if (nome === "rh_administrativo" || nome === "gestor_diretoria") return "regular"
  return "outline"
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const sp = await searchParams
  const page = parsePageParam(sp.page)

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
                Apenas administradores podem gerenciar usuários.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin — paginação server-side em `usuarios` via `.range()` + `count: "exact"`.
  // Para `auth.users`, buscamos uma janela grande (1000) em 1 chamada — suficiente
  // para as primeiras páginas; crescer para paginação dedicada do auth quando
  // passar de 1000 usuários (ainda longe).
  const admin = createAdminClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const [usuariosResult, authResult] = await Promise.all([
    admin.from("usuarios")
      .select(
        "id, ativo, ultimo_acesso, created_at, perfis_acesso(nome, descricao), empresas(razao_social), colaboradores(nome_completo)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const usuariosRows = usuariosResult.data
  const totalUsuarios = usuariosResult.count ?? 0

  const emailPorId = new Map<string, { email?: string; last_sign_in_at?: string | null }>()
  for (const u of authResult?.data?.users ?? []) {
    emailPorId.set(u.id, { email: u.email, last_sign_in_at: u.last_sign_in_at })
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="h-7 w-7" />
            Usuários
          </h1>
          <p className="text-muted-foreground">
            Gestão de acesso ao sistema. Criação cria tanto o login quanto o vínculo com perfil + empresa.
          </p>
        </div>
        <Button asChild>
          <Link href="/usuarios/new"><Plus className="h-4 w-4" />Novo usuário</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{totalUsuarios} usuário(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Colaborador vinculado</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosRows?.map((u) => {
                const authInfo = emailPorId.get(u.id)
                const perfil = Array.isArray(u.perfis_acesso) ? u.perfis_acesso[0] : u.perfis_acesso
                const empresa = Array.isArray(u.empresas) ? u.empresas[0] : u.empresas
                const colab = Array.isArray(u.colaboradores) ? u.colaboradores[0] : u.colaboradores
                const ultimoAcesso = authInfo?.last_sign_in_at ?? u.ultimo_acesso
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{authInfo?.email ?? "(sem e-mail)"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {u.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>{colab?.nome_completo ?? "—"}</TableCell>
                    <TableCell>
                      {perfil ? (
                        <Badge variant={perfilVariant(perfil.nome)} title={perfil.descricao}>
                          {perfil.nome}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{empresa?.razao_social ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {ultimoAcesso ? new Date(ultimoAcesso).toLocaleString("pt-BR") : "Nunca"}
                    </TableCell>
                    <TableCell>
                      {u.ativo
                        ? <Badge variant="regular">Ativo</Badge>
                        : <Badge variant="vencido">Inativo</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/usuarios/${u.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!usuariosRows || usuariosRows.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    {page > 1 ? "Nenhum usuário nesta página." : "Nenhum usuário cadastrado."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Pagination
            baseHref="/usuarios"
            currentPage={page}
            totalItems={totalUsuarios}
            perPage={PER_PAGE}
            label="usuário(s)"
          />
        </CardContent>
      </Card>
    </div>
  )
}

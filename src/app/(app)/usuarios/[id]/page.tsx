import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import { EditarUsuarioForm } from "./editar-usuario-form"

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: perfilNome } = await supabase.rpc("user_perfil_nome")
  if (perfilNome !== "admin") {
    return (
      <div className="container py-8">
        <Card className="border-status-alerta">
          <CardContent className="flex items-start gap-3 py-6">
            <ShieldAlert className="h-5 w-5 text-status-alerta shrink-0 mt-0.5" />
            <p className="text-sm">Apenas administradores podem editar usuários.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const admin = createAdminClient()
  const [
    { data: usuario },
    { data: perfis },
    { data: empresas },
    { data: colaboradores },
    authInfo,
  ] = await Promise.all([
    admin.from("usuarios").select("*").eq("id", id).single(),
    admin.from("perfis_acesso").select("id, nome, descricao").order("nome"),
    admin.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    admin.from("colaboradores").select("id, nome_completo, email").eq("status", "ativo").order("nome_completo"),
    admin.auth.admin.getUserById(id),
  ])

  if (!usuario) notFound()

  const authEmail = authInfo.data.user?.email ?? "(sem email)"
  const lastSignIn = authInfo.data.user?.last_sign_in_at ?? null
  const isSelf = user.id === id

  return (
    <div className="container py-8 max-w-3xl">
      <EditarUsuarioForm
        usuarioId={id}
        authEmail={authEmail}
        lastSignIn={lastSignIn}
        isSelf={isSelf}
        initial={{
          perfil_id: usuario.perfil_id ?? "",
          empresa_id: usuario.empresa_id ?? "",
          colaborador_id: usuario.colaborador_id ?? null,
          ativo: usuario.ativo,
        }}
        perfis={perfis ?? []}
        empresas={empresas ?? []}
        colaboradores={colaboradores ?? []}
      />
    </div>
  )
}

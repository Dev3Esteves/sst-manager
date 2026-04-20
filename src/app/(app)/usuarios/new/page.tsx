import { redirect } from "next/navigation"
import { checkRole } from "@/lib/auth/guards"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import { NovoUsuarioForm } from "./novo-usuario-form"

export default async function NovoUsuarioPage() {
  const r = await checkRole(["admin"])
  if (r.status === "unauth") redirect("/login")
  if (r.status === "forbidden") {
    return (
      <div className="container py-8">
        <Card className="border-status-alerta">
          <CardContent className="flex items-start gap-3 py-6">
            <ShieldAlert className="h-5 w-5 text-status-alerta shrink-0 mt-0.5" />
            <p className="text-sm">Apenas administradores podem criar usuários.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { supabase } = r.ctx
  const [{ data: perfis }, { data: empresas }, { data: colaboradores }] = await Promise.all([
    supabase.from("perfis_acesso").select("id, nome, descricao").order("nome"),
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("colaboradores").select("id, nome_completo, email").eq("status", "ativo").order("nome_completo"),
  ])

  return (
    <div className="container py-8 max-w-3xl">
      <NovoUsuarioForm
        perfis={perfis ?? []}
        empresas={empresas ?? []}
        colaboradores={colaboradores ?? []}
      />
    </div>
  )
}

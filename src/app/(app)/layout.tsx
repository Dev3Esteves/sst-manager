import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Toaster } from "sonner"
import { createClient } from "@/lib/supabase/server"
import { getMarca } from "@/lib/branding/marca"
import { getAuth } from "@/lib/auth/guards"
import { precisaSetupOrganizacao } from "@/lib/organizacao/first-run"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // First-run guard: admin sem Organização configurada vai pro setup.
  const auth = await getAuth()
  if (auth?.perfil === "admin" && (await precisaSetupOrganizacao())) {
    redirect("/organizacao")
  }

  // Topo da sidebar = MARCA da Organização (determinística). O nome da empresa
  // própria ativa entra apenas como legenda/contexto.
  const marca = await getMarca()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let empresaNome: string | null = null
  if (user) {
    const { data: u } = await supabase
      .from("usuarios")
      .select("empresa_ativa_id, empresa_id")
      .eq("id", user.id)
      .maybeSingle()
    const empId = (u as { empresa_ativa_id?: string | null; empresa_id?: string | null } | null)?.empresa_ativa_id
      ?? (u as { empresa_id?: string | null } | null)?.empresa_id
    if (empId) {
      const { data: emp } = await supabase
        .from("empresas")
        .select("razao_social")
        .eq("id", empId)
        .maybeSingle()
      empresaNome = (emp as { razao_social?: string | null } | null)?.razao_social ?? null
    }
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar marcaLogoUrl={marca.logoUrl} marcaNome={marca.nome} empresaNome={empresaNome} />
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-[72px] 2xl:pl-64">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/30 pb-20 lg:pb-0">{children}</main>
        <Toaster richColors position="top-right" />
      </div>
      <BottomNav />
    </div>
  )
}

import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Toaster } from "sonner"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Logo da empresa ativa para o topo da sidebar (fallback: ícone SISTENGE).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let empresaLogoUrl: string | null = null
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
        .select("razao_social, logo_url")
        .eq("id", empId)
        .maybeSingle()
      empresaLogoUrl = (emp as { logo_url?: string | null } | null)?.logo_url ?? null
      empresaNome = (emp as { razao_social?: string | null } | null)?.razao_social ?? null
    }
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar empresaLogoUrl={empresaLogoUrl} empresaNome={empresaNome} />
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-[72px] 2xl:pl-64">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/30 pb-20 lg:pb-0">{children}</main>
        <Toaster richColors position="top-right" />
      </div>
      <BottomNav />
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { LogoutButton } from "./logout-button"
import { MobileNav } from "./mobile-nav"
import { OfflineStatus } from "./offline-status"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CommandPaletteTrigger } from "@/components/command-palette"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsBell } from "./notifications-bell"
import { primeiroNome } from "@/lib/utils/nome"

export async function Topbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca nome do colaborador vinculado ao usuário (para primeiro nome na topbar)
  let nome: string | null = null
  if (user?.id) {
    const { data } = await supabase
      .from("usuarios")
      .select("colaboradores:colaborador_id(nome_completo)")
      .eq("id", user.id)
      .maybeSingle()
    // Supabase retorna relação como objeto quando FK aponta para 1 registro
    const colab = (data as { colaboradores?: { nome_completo?: string } | null } | null)?.colaboradores
    nome = primeiroNome(colab?.nome_completo)
  }

  const saudacao = nome ?? user?.email ?? ""

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
      <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <MobileNav />
          <div className="hidden lg:block min-w-0 flex-1">
            <Breadcrumbs />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <CommandPaletteTrigger />
          </div>
          <OfflineStatus />
          <NotificationsBell />
          <ThemeToggle />
          <div className="hidden lg:flex items-center gap-3 ml-2 pl-3 border-l">
            <span
              className="text-sm truncate max-w-[220px] text-muted-foreground"
              title={user?.email ?? ""}
            >
              {nome ? `Olá, ${saudacao}` : saudacao}
            </span>
            <LogoutButton />
          </div>
          <div className="lg:hidden">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Drawer } from "vaul"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Building2, Users, UserCog, HeartPulse, GraduationCap,
  HardHat, FileText, AlertTriangle, ClipboardCheck, Clock, Grid3x3,
  History, MessageSquare, FileBarChart, MapPin, Settings, Menu, X,
  type LucideIcon,
} from "lucide-react"
import { SistengeLogo } from "@/components/sistenge-logo"

type Item = { href: string; label: string; icon: LucideIcon; disabled?: boolean }

const sections: { label?: string; items: Item[] }[] = [
  { items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vencimentos", label: "Vencimentos", icon: Clock },
  ]},
  { label: "Cadastros", items: [
    { href: "/empresas", label: "Empresas", icon: Building2 },
    { href: "/cargos", label: "Cargos", icon: Users },
    { href: "/colaboradores", label: "Colaboradores", icon: Users },
    { href: "/epis", label: "EPIs", icon: HardHat },
    { href: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
  ]},
  { label: "Operação", items: [
    { href: "/exames", label: "Exames médicos", icon: HeartPulse },
    { href: "/documentos", label: "Documentos SST", icon: FileText },
    { href: "/dds", label: "DDS", icon: MessageSquare },
    { href: "/ocorrencias", label: "Ocorrências", icon: AlertTriangle },
    { href: "/inspecoes", label: "Inspeções", icon: ClipboardCheck },
  ]},
  { label: "Relatórios", items: [
    { href: "/matriz-treinamentos", label: "Matriz treinamentos", icon: Grid3x3 },
    { href: "/relatorios/mensal", label: "Relatório mensal", icon: FileBarChart },
    { href: "/relatorios/heatmap-ocorrencias", label: "Heatmap ocorrências", icon: MapPin },
  ]},
  { label: "Administração", items: [
    { href: "/usuarios", label: "Usuários", icon: UserCog },
    { href: "/auditoria", label: "Auditoria", icon: History },
    { href: "/configuracoes", label: "Configurações", icon: Settings, disabled: true },
  ]},
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} direction="left">
      <Drawer.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background border-r outline-none">
          <Drawer.Title className="sr-only">Menu de navegação</Drawer.Title>
          <Drawer.Description className="sr-only">Navegação principal do sistema</Drawer.Description>
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SistengeLogo variant="icon" height={32} />
              <div>
                <div className="text-sm font-semibold leading-tight">SST Manager</div>
                <div className="text-xs text-muted-foreground leading-tight">SISTENGE</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 space-y-4 p-3 overflow-y-auto">
            {sections.map((section, si) => (
              <div key={si} className="space-y-0.5">
                {section.label && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {section.label}
                  </div>
                )}
                {section.items.map(({ href, label, icon: Icon, disabled }) => {
                  const active = pathname === href || pathname.startsWith(href + "/")
                  if (disabled) {
                    return (
                      <div key={href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground/60">
                        <Icon className="h-4 w-4" />
                        {label}
                        <span className="ml-auto text-[10px] uppercase">soon</span>
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

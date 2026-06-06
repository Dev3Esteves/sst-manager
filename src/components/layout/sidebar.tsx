"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Building2, Users, UserCog, HeartPulse, GraduationCap,
  HardHat, FileText, AlertTriangle, ClipboardCheck, Clock, Grid3x3,
  History, MessageSquare, FileBarChart, MapPin, Settings,
  HardDrive, ListTodo, BookMarked, ShieldCheck, Brain, BookOpen,
  type LucideIcon,
} from "lucide-react"
import { SistengeLogo } from "@/components/sistenge-logo"
import { APP_VERSION } from "@/lib/version"

type NavItem = { href: string; label: string; icon: LucideIcon; disabled?: boolean }
type NavSection = { label?: string; items: NavItem[] }

const sections: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/vencimentos", label: "Vencimentos", icon: Clock },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { href: "/empresas", label: "Empresas", icon: Building2 },
      { href: "/obras", label: "Obras", icon: HardDrive },
      { href: "/cargos", label: "Cargos", icon: Users },
      { href: "/colaboradores", label: "Colaboradores", icon: Users },
      { href: "/epis", label: "EPIs", icon: HardHat },
      { href: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/exames", label: "Exames médicos", icon: HeartPulse },
      { href: "/pgr", label: "PGR", icon: ShieldCheck },
      { href: "/psicossocial", label: "Psicossocial (NR-01)", icon: Brain },
      { href: "/documentos", label: "Documentos SST", icon: FileText },
      { href: "/dds", label: "DDS", icon: MessageSquare },
      { href: "/ocorrencias", label: "Ocorrências", icon: AlertTriangle },
      { href: "/inspecoes", label: "Inspeções", icon: ClipboardCheck },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { href: "/matriz-treinamentos", label: "Matriz treinamentos", icon: Grid3x3 },
      { href: "/nao-conformidades", label: "Não-Conformidades", icon: ShieldCheck },
      { href: "/relatorios/mensal", label: "Relatório mensal", icon: FileBarChart },
      { href: "/relatorios/heatmap-ocorrencias", label: "Heatmap ocorrências", icon: MapPin },
    ],
  },
  {
    label: "Referências",
    items: [
      { href: "/referencias/nrs", label: "Normas Regulamentadoras", icon: BookMarked },
      { href: "/referencias/esocial", label: "Tabela 22 eSocial", icon: BookMarked },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/usuarios", label: "Usuários", icon: UserCog },
      { href: "/jobs", label: "Fila de jobs", icon: ListTodo },
      { href: "/auditoria", label: "Auditoria", icon: History },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
  {
    items: [
      { href: "/ajuda", label: "Ajuda / Manuais", icon: BookOpen },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="
        group/sidebar fixed inset-y-0 left-0 z-40
        hidden lg:flex lg:flex-col
        w-[72px] hover:w-64
        border-r bg-background
        transition-[width,box-shadow] duration-200 ease-out hover:shadow-md
        overflow-hidden print:hidden
      "
    >
      <div className="flex h-16 items-center gap-2 border-b px-[22px]">
        <SistengeLogo variant="icon" height={30} />
        <div className="opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 whitespace-nowrap">
          <div className="text-sm font-semibold leading-tight">SST Manager</div>
          <div className="text-xs text-muted-foreground leading-tight">SISTENGE</div>
        </div>
      </div>
      <nav className="flex-1 space-y-4 p-3 overflow-y-auto overflow-x-hidden">
        {sections.map((section, si) => (
          <div key={si} className="space-y-0.5">
            {section.label && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
                {section.label}
              </div>
            )}
            {section.items.map(({ href, label, icon: Icon, disabled }) => {
              const active = pathname === href || pathname.startsWith(href + "/")
              if (disabled) {
                return (
                  <div
                    key={href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60 cursor-not-allowed"
                    title="Em breve"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">{label}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">soon</span>
                  </div>
                )
              }
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="border-t p-3 text-[10px] text-muted-foreground space-y-2 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
        <div className="flex items-center justify-between">
          <span>Pressione</span>
          <kbd className="inline-flex items-center rounded border bg-background px-1.5 py-0.5 font-mono">
            Ctrl + K
          </kbd>
        </div>
        <div className="text-center text-muted-foreground/70">
          SST Manager · v{APP_VERSION}
        </div>
      </div>
    </aside>
  )
}

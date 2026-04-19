"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

// Dicionário de labels para segmentos conhecidos — sobrescreve capitalização automática
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  vencimentos: "Vencimentos",
  empresas: "Empresas",
  cargos: "Cargos",
  colaboradores: "Colaboradores",
  exames: "Exames",
  treinamentos: "Treinamentos",
  realizacoes: "Realizações",
  epis: "EPIs",
  entregas: "Entregas",
  documentos: "Documentos",
  apr: "APR",
  pt: "PT",
  "autorizacao-nr": "Autorização NR",
  dds: "DDS",
  ocorrencias: "Ocorrências",
  inspecoes: "Inspeções",
  "matriz-treinamentos": "Matriz de treinamentos",
  relatorios: "Relatórios",
  mensal: "Mensal",
  "heatmap-ocorrencias": "Heatmap",
  usuarios: "Usuários",
  auditoria: "Auditoria",
  new: "Novo",
  importar: "Importar",
  lote: "Em lote",
  ocr: "OCR de ASO",
}

function labelFor(segment: string): string {
  if (LABELS[segment]) return LABELS[segment]
  // UUIDs — mostra "Detalhe"
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return "Detalhe"
  }
  // Capitaliza primeira letra
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  if (!pathname || pathname === "/" || pathname === "/dashboard") return null

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null

  const trail = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }))

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors" aria-label="Home">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {trail.map((t) => (
        <div key={t.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 opacity-50" />
          {t.isLast ? (
            <span className="font-medium text-foreground">{t.label}</span>
          ) : (
            <Link href={t.href} className="hover:text-foreground transition-colors">
              {t.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

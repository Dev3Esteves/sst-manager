"use client"

/**
 * Bottom navigation para mobile — 5 atalhos táteis principais.
 * Visível só em < lg (mobile/tablet pequeno). O botão central (+) abre um
 * menu de ações rápidas para uso em campo.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Home, Clock, MessageSquare, AlertTriangle, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = {
  href: string
  label: string
  icon: typeof Home
  isFab?: boolean
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/vencimentos", label: "Prazos", icon: Clock },
  { href: "__fab__", label: "", icon: Plus, isFab: true },
  { href: "/dds", label: "DDS", icon: MessageSquare },
  { href: "/ocorrencias", label: "Ocorrên.", icon: AlertTriangle },
]

const FAB_ACOES = [
  { label: "Novo DDS", href: "/dds/new", emoji: "🗣️" },
  { label: "Registrar ocorrência", href: "/ocorrencias/new", emoji: "⚠️" },
  { label: "Nova inspeção", href: "/inspecoes/new", emoji: "✅" },
  { label: "Registrar exame", href: "/exames/new", emoji: "🩺" },
  { label: "Escanear ASO", href: "/exames/ocr", emoji: "📷" },
  { label: "Novo documento", href: "/documentos/new", emoji: "📄" },
]

export function BottomNav() {
  const pathname = usePathname()
  const [fabOpen, setFabOpen] = useState(false)

  return (
    <>
      {/* Menu FAB expandido */}
      {fabOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setFabOpen(false)}
          />
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 w-[90vw] max-w-md lg:hidden animate-in slide-in-from-bottom-4 fade-in">
            <div className="rounded-xl border bg-background shadow-lg overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <span className="text-sm font-semibold">Ações rápidas</span>
                <button
                  type="button"
                  onClick={() => setFabOpen(false)}
                  className="rounded-full p-1 hover:bg-accent"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y [&>*]:border-border">
                {FAB_ACOES.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    onClick={() => setFabOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <span className="text-xl">{a.emoji}</span>
                    <span className="text-sm font-medium">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom,0px)] print:hidden"
        aria-label="Navegação rápida"
      >
        <div className="grid grid-cols-5 h-16">
          {TABS.map((t, i) => {
            if (t.isFab) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFabOpen((v) => !v)}
                  className="flex items-center justify-center"
                  aria-label="Ações rápidas"
                >
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg -mt-4 transition-transform",
                    fabOpen && "rotate-45"
                  )}>
                    <Plus className="h-5 w-5" />
                  </div>
                </button>
              )
            }
            const active = pathname === t.href || pathname.startsWith(t.href + "/")
            const Icon = t.icon
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "scale-110")} />
                <span className="text-[10px] font-medium">{t.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

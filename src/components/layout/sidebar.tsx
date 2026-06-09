"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS } from "./nav-config"
import { BrandLogo } from "@/components/brand-logo"
import { APP_VERSION } from "@/lib/version"

const sections = NAV_SECTIONS

export function Sidebar({
  empresaLogoUrl = null,
  empresaNome = null,
}: {
  empresaLogoUrl?: string | null
  empresaNome?: string | null
} = {}) {
  const pathname = usePathname()

  return (
    <aside
      className="
        group/sidebar fixed inset-y-0 left-0 z-40
        hidden lg:flex lg:flex-col
        w-[72px] hover:w-64 2xl:w-64
        border-r bg-background
        transition-[width,box-shadow] duration-200 ease-out hover:shadow-md 2xl:hover:shadow-none
        overflow-hidden print:hidden
      "
    >
      <div className="flex h-16 items-center border-b overflow-hidden">
        {/* Recolhida: ícone neutro do produto no trilho de 72px */}
        <div className="flex w-[72px] shrink-0 items-center justify-center group-hover/sidebar:hidden 2xl:hidden">
          <BrandLogo variant="icon" height={34} />
        </div>
        {/* Expandida: logo da empresa ativa; fallback ícone + nome */}
        <div className="hidden min-w-0 items-center px-[22px] group-hover/sidebar:flex 2xl:flex">
          {empresaLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={empresaLogoUrl}
              alt={empresaNome ?? "Empresa"}
              className="h-9 w-auto max-w-[200px] object-contain"
            />
          ) : (
            <BrandLogo nome={empresaNome ?? undefined} variant="full" height={26} />
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-4 p-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {sections.map((section, si) => (
          <div key={si} className="space-y-0.5">
            {section.label && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 2xl:opacity-100">
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
                    <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 2xl:opacity-100">{label}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 2xl:opacity-100">soon</span>
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
                  <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 2xl:opacity-100">{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="border-t p-3 text-[10px] text-muted-foreground space-y-2 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 2xl:opacity-100">
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

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Drawer } from "vaul"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { NAV_SECTIONS } from "./nav-config"
import { SistengeLogo } from "@/components/sistenge-logo"

const sections = NAV_SECTIONS

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

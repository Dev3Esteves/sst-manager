"use client"

import Link from "next/link"
import { useState } from "react"
import { Bell, Clock, AlertTriangle, XCircle, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Notificacao } from "./notifications-bell"

const ICON_MAP = { clock: Clock, alert: AlertTriangle, xcircle: XCircle, check: ClipboardCheck }

export function NotificationsPopover({
  notifs, total, criticos,
}: {
  notifs: Notificacao[]
  total: number
  criticos: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificações — ${total} pendentes`}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              criticos > 0 ? "bg-status-vencido" : "bg-status-alerta"
            }`}
          >
            {total > 99 ? "99+" : total}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b p-3">
              <div>
                <div className="font-semibold text-sm">Notificações</div>
                <div className="text-xs text-muted-foreground">
                  {total === 0 ? "Tudo em dia 🎉" : `${total} pendente(s)${criticos > 0 ? ` · ${criticos} crítica(s)` : ""}`}
                </div>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto h-8 w-8 opacity-30 mb-2" />
                  Nenhuma pendência no momento.
                </div>
              ) : (
                <ul>
                  {notifs.map((n) => {
                    const Icon = ICON_MAP[n.icon]
                    const color = n.urgencia === "critico" ? "text-status-vencido" : n.urgencia === "alerta" ? "text-status-alerta" : "text-muted-foreground"
                    return (
                      <li key={n.id} className="border-b last:border-b-0">
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className="flex gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                        >
                          <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{n.titulo}</div>
                            <div className="text-xs text-muted-foreground truncate">{n.descricao}</div>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <div className="border-t p-2 flex gap-1">
              <Button variant="ghost" size="sm" className="flex-1" asChild onClick={() => setOpen(false)}>
                <Link href="/vencimentos">Ver vencimentos</Link>
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" asChild onClick={() => setOpen(false)}>
                <Link href="/ocorrencias">Ver ocorrências</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

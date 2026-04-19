import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Bell, Clock, AlertTriangle, XCircle, ClipboardCheck } from "lucide-react"
import { NotificationsPopover } from "./notifications-popover"

export type Notificacao = {
  id: string
  icon: "clock" | "alert" | "xcircle" | "check"
  urgencia: "critico" | "alerta" | "info"
  titulo: string
  descricao: string
  href: string
}

/** Busca fontes de alertas. Retorna no máximo 20 itens, priorizados por urgência. */
export async function NotificationsBell() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [vencCriticos, ocorrAbertas] = await Promise.all([
    supabase
      .from("vw_vencimentos")
      .select("*")
      .in("urgencia", ["critico", "vencido"])
      .order("dias_restantes", { ascending: true })
      .limit(10),
    supabase
      .from("ocorrencias")
      .select("id, tipo, data_ocorrencia, local, gravidade, status")
      .eq("status", "aberta")
      .order("data_ocorrencia", { ascending: false })
      .limit(10),
  ])

  const notifs: Notificacao[] = []

  for (const v of vencCriticos.data ?? []) {
    notifs.push({
      id: `venc-${v.categoria}-${v.item}`,
      icon: v.urgencia === "vencido" ? "xcircle" : "clock",
      urgencia: v.urgencia === "vencido" ? "critico" : "alerta",
      titulo: v.item,
      descricao: v.colaborador
        ? `${v.colaborador} · ${v.dias_restantes < 0 ? `${Math.abs(v.dias_restantes)}d atrás` : `${v.dias_restantes}d restantes`}`
        : `${v.dias_restantes < 0 ? `${Math.abs(v.dias_restantes)}d atrás` : `${v.dias_restantes}d restantes`}`,
      href: "/vencimentos",
    })
  }

  for (const o of ocorrAbertas.data ?? []) {
    notifs.push({
      id: `ocorr-${o.id}`,
      icon: o.gravidade === "fatal" || o.gravidade === "grave" ? "alert" : "check",
      urgencia: o.gravidade === "fatal" || o.gravidade === "grave" ? "critico" : "info",
      titulo: `Ocorrência ${o.tipo} aberta`,
      descricao: `${o.local} · aguarda investigação`,
      href: `/ocorrencias/${o.id}`,
    })
  }

  const total = notifs.length
  const criticos = notifs.filter((n) => n.urgencia === "critico").length

  return <NotificationsPopover notifs={notifs} total={total} criticos={criticos} />
}

export const ICON_MAP = { clock: Clock, alert: AlertTriangle, xcircle: XCircle, check: ClipboardCheck, bell: Bell }
export type IconKey = keyof typeof ICON_MAP

export const NotificationsLink = Link // re-export conveniência

import type { BadgeProps } from "@/components/ui/badge"

export type Urgencia = "regular" | "alerta" | "critico" | "vencido"

export function classificarVencimento(dataVencimento: string | null | undefined): Urgencia | null {
  if (!dataVencimento) return null

  // Parseia a parte YYYY-MM-DD manualmente e constrói a Date em horário LOCAL.
  // Evita o bug clássico do JavaScript onde `new Date("2026-04-18")` é interpretado
  // como UTC (00:00Z) e em fusos negativos (ex: BRT UTC-3) vira o dia anterior local.
  const parts = dataVencimento.slice(0, 10).split("-")
  if (parts.length !== 3) return null
  const [ano, mes, dia] = parts.map(Number)
  if (!ano || !mes || !dia) return null
  const venc = new Date(ano, mes - 1, dia)
  venc.setHours(0, 0, 0, 0)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const diffMs = venc.getTime() - hoje.getTime()
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (dias < 0) return "vencido"
  if (dias <= 30) return "critico"
  if (dias <= 60) return "alerta"
  return "regular"
}

export function urgenciaBadgeVariant(u: Urgencia | null): BadgeProps["variant"] {
  if (!u) return "secondary"
  return u
}

export function urgenciaLabel(u: Urgencia | null): string {
  switch (u) {
    case "regular": return "Em dia"
    case "alerta": return "Alerta"
    case "critico": return "Crítico"
    case "vencido": return "Vencido"
    default: return "—"
  }
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}

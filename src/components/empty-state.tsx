import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

type Props = {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  className?: string
}

/**
 * Empty state padrão: ícone grande + título + descrição + CTA.
 * Uso: quando uma listagem está vazia, ou um filtro não retornou resultados.
 */
export function EmptyState({
  icon: Icon, title, description,
  actionLabel, actionHref,
  secondaryLabel, secondaryHref,
  className = "",
}: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {actionLabel && actionHref && (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          )}
          {secondaryLabel && secondaryHref && (
            <Button variant="outline" asChild>
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

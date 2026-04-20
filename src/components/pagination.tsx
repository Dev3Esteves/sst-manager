import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Paginação server-driven via search params. Reutilizável em qualquer listagem.
 *
 * @param baseHref caminho base (ex: "/usuarios") — o helper preserva outros params
 * @param currentParams objeto de search params da rota (o que o `page.tsx` recebe)
 *                       exceto o `page` que este componente gerencia
 */
export function Pagination({
  baseHref,
  currentPage,
  totalItems,
  perPage,
  currentParams = {},
  label = "itens",
}: {
  baseHref: string
  currentPage: number
  totalItems: number
  perPage: number
  /** Preserva filtros/query existentes. Chave=valor, ambos string. */
  currentParams?: Record<string, string | undefined>
  label?: string
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const page = Math.min(Math.max(1, currentPage), totalPages)
  const inicio = totalItems === 0 ? 0 : (page - 1) * perPage + 1
  const fim = Math.min(page * perPage, totalItems)

  function hrefFor(target: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(currentParams)) {
      if (v !== undefined && v !== "" && k !== "page") params.set(k, v)
    }
    if (target > 1) params.set("page", String(target))
    const qs = params.toString()
    return qs ? `${baseHref}?${qs}` : baseHref
  }

  if (totalPages <= 1) {
    return (
      <div className="text-xs text-muted-foreground text-right py-2">
        {totalItems} {label}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-xs text-muted-foreground">
        Mostrando <strong>{inicio}</strong>–<strong>{fim}</strong> de{" "}
        <strong>{totalItems}</strong> {label}
      </p>
      <div className="flex items-center gap-1">
        <NavBtn href={hrefFor(1)} disabled={page === 1} ariaLabel="Primeira página">
          <ChevronsLeft className="h-4 w-4" />
        </NavBtn>
        <NavBtn href={hrefFor(page - 1)} disabled={page === 1} ariaLabel="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </NavBtn>
        <span className="px-3 text-sm tabular-nums">
          {page} / {totalPages}
        </span>
        <NavBtn href={hrefFor(page + 1)} disabled={page === totalPages} ariaLabel="Próxima página">
          <ChevronRight className="h-4 w-4" />
        </NavBtn>
        <NavBtn href={hrefFor(totalPages)} disabled={page === totalPages} ariaLabel="Última página">
          <ChevronsRight className="h-4 w-4" />
        </NavBtn>
      </div>
    </div>
  )
}

function NavBtn({
  href, disabled, ariaLabel, children,
}: {
  href: string
  disabled: boolean
  ariaLabel: string
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label={ariaLabel} className={cn("opacity-40")}>
        {children}
      </Button>
    )
  }
  return (
    <Button variant="ghost" size="icon" asChild aria-label={ariaLabel}>
      <Link href={href} prefetch={false} scroll={false}>
        {children}
      </Link>
    </Button>
  )
}

/**
 * Parser seguro para o query param `page` da URL.
 * - Trata undefined, string vazia, não-numérico, zero e negativos → volta 1
 * - Não cria limite superior aqui; o componente cuida disso com `totalPages`
 */
export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  const n = value ? parseInt(value, 10) : 1
  if (!Number.isFinite(n) || n < 1) return 1
  return n
}

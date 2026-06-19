import type { ReactNode } from "react"

/**
 * Cabeçalho padrão de página interna: título + descrição + ações.
 * Uniformiza ritmo e evita que cada página invente seu layout.
 *
 * @example
 * <PageHeader
 *   title="Colaboradores"
 *   description="Cadastro de empregados próprios e terceiros."
 *   actions={<>
 *     <Button variant="outline" asChild>...</Button>
 *     <Button asChild>...</Button>
 *   </>}
 * />
 */
export function PageHeader({
  title, description, actions, icon,
}: {
  title: string
  description?: string
  actions?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 sm:flex-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          {icon && <span className="shrink-0 [&>svg]:h-6 [&>svg]:w-6 md:[&>svg]:h-7 md:[&>svg]:w-7">{icon}</span>}
          <span className="min-w-0">{title}</span>
        </h1>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 flex-wrap sm:justify-end sm:shrink-0">{actions}</div>}
    </div>
  )
}

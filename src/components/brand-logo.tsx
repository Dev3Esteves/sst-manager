import Image from "next/image"
import { cn } from "@/lib/utils"
import { brand } from "@/config/brand"

/**
 * Logo do produto (white-label). Duas variantes:
 *  - `full` (padrão): logotipo horizontal completo com texto
 *  - `icon`: só o ícone (para favicon, sidebar compacta, etc.)
 *
 * As fontes vêm de `@/config/brand` (env `NEXT_PUBLIC_BRAND_LOGO_*`), então
 * trocar a marca é trocar os arquivos em `/public/logos/` ou apontar o env —
 * sem mexer aqui.
 *
 * Troca automática por tema via Tailwind `dark:` — renderiza as duas variantes
 * (clara/escura) e usa `hidden dark:block` / `dark:hidden` para alternar sem
 * flash na hidratação (evita delay do JS).
 */
export function BrandLogo({
  variant = "full",
  className,
  priority = false,
  height = 40,
}: {
  variant?: "full" | "icon"
  /** Classes adicionais aplicadas no wrapper */
  className?: string
  /** Passa `priority` pro Next/Image quando o logo é acima da dobra (login, cabeçalho) */
  priority?: boolean
  /** Altura em px. Width é calculada preservando o aspect ratio. */
  height?: number
}) {
  const aspect = variant === "full" ? brand.logo.fullAspect : 1
  const width = Math.round(height * aspect)
  const alt = brand.companyName || brand.appName

  // Tema claro (fundo claro) → logo escuro/colorido; tema escuro → logo claro/branco.
  const srcLight = variant === "full" ? brand.logo.fullLight : brand.logo.iconLight
  const srcDark = variant === "full" ? brand.logo.fullDark : brand.logo.iconDark

  return (
    <span className={cn("inline-block leading-none", className)}>
      {/* Tema claro — fundo claro → logo escuro */}
      <Image
        src={srcLight}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="block dark:hidden"
      />
      {/* Tema escuro — fundo escuro → logo claro */}
      <Image
        src={srcDark}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="hidden dark:block"
      />
    </span>
  )
}

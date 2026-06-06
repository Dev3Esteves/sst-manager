import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Logo oficial da SISTENGE. Duas variantes:
 *  - `full` (padrão): logotipo horizontal completo com texto
 *  - `icon`: só o ícone "S" estilizado (para favicon, sidebar compacta, etc.)
 *
 * Troca automática por tema via Tailwind `dark:` — renderiza as duas
 * variantes (clara/escura) e usa `hidden dark:block` / `dark:hidden` para
 * alternar sem flash na hidratação (evita delay do JS).
 *
 * Imagens são SVG servidas direto do `/public/logos/*.svg`.
 */
export function SistengeLogo({
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
  /** Altura em px. Width é calculada preservando o aspect ratio oficial. */
  height?: number
}) {
  const aspect = variant === "full" ? 1920 / 392.19 : 1
  const width = Math.round(height * aspect)
  const alt = "SISTENGE"

  // Tema claro (fundo claro) → logo escuro/colorido; tema escuro → logo claro/branco.
  const srcLight = variant === "full" ? "/logos/sistenge-claro.svg" : "/logos/sistenge-icone-principal.svg"
  const srcDark = variant === "full" ? "/logos/sistenge-escuro.svg" : "/logos/sistenge-icone-branco.svg"

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

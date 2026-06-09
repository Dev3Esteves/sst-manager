import { cn } from "@/lib/utils"

/**
 * Logo da marca (empresa dona do sistema / empresa ativa).
 *
 * - Com `logoUrl` (logo cadastrada da empresa) → renderiza a imagem.
 * - Sem logo → fallback neutro: ícone genérico (`/icon.svg`) + o nome no modo
 *   `full`. Nunca usa artwork de cliente específico.
 *
 * Componente puramente apresentacional (client-safe): a fonte dos dados
 * (`nome`/`logoUrl`) vem por prop — em servidor, de `getMarca()`; no app, da
 * empresa ativa.
 */
export function BrandLogo({
  logoUrl,
  nome = "SST Manager",
  height = 40,
  variant = "full",
  className,
}: {
  logoUrl?: string | null
  nome?: string
  height?: number
  variant?: "full" | "icon"
  className?: string
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt={nome}
        className={cn("w-auto max-w-full object-contain", className)}
        style={{ height }}
      />
    )
  }
  return (
    <span className={cn("inline-flex items-center gap-2 leading-none", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt={nome} style={{ height, width: height }} />
      {variant === "full" && (
        <span className="font-semibold tracking-tight" style={{ fontSize: Math.round(height * 0.45) }}>
          {nome}
        </span>
      )}
    </span>
  )
}

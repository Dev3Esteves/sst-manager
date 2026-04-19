import { cn } from "@/lib/utils"

/**
 * Paleta determinística: a mesma empresa sempre aparece com a mesma cor
 * (hash do UUID -> índice na paleta). Cores escolhidas para contrastar
 * bem entre si e serem distinguíveis em dark mode.
 */
const PALETA = [
  "bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-blue-500/30",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/30",
  "bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-purple-500/30",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  "bg-pink-500/15 text-pink-700 dark:text-pink-300 ring-pink-500/30",
  "bg-amber-600/15 text-amber-700 dark:text-amber-300 ring-amber-600/30",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 ring-cyan-500/30",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-teal-500/30",
]

/** djb2 hash estável (determinístico entre SSR e client). */
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}

export function corDaEmpresa(empresaId?: string | null): string {
  if (!empresaId) return PALETA[0]
  return PALETA[hash(empresaId) % PALETA.length]
}

/**
 * Badge colorido identificando a empresa do registro. Útil em listas
 * cross-empresa (admin view) para reforçar a qual empresa cada linha
 * pertence — uma das decisões do plano: "Cada registro pertence a uma
 * empresa" com reforço visual no lugar de switcher global.
 */
export function EmpresaBadge({
  empresaId,
  nome,
  className,
  compact,
}: {
  empresaId?: string | null
  nome?: string | null
  className?: string
  /** Versão compacta sem o texto (só o "dot" colorido). */
  compact?: boolean
}) {
  const cor = corDaEmpresa(empresaId)
  const label = nome || "—"

  if (compact) {
    return (
      <span
        className={cn("inline-block h-2 w-2 rounded-full ring-2", cor.split(" ").find((c) => c.startsWith("ring-")), className)}
        title={label}
        aria-label={`Empresa: ${label}`}
      />
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1",
        cor,
        className,
      )}
      title={label}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          cor.split(" ").find((c) => c.startsWith("bg-"))?.replace("/15", ""),
        )}
        aria-hidden
      />
      <span className="truncate max-w-[180px]">{label}</span>
    </span>
  )
}

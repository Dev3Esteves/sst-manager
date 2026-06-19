/**
 * Datas/horas "agora" no fuso de Brasília (America/Sao_Paulo).
 *
 * Por que existir: no servidor (Vercel) `new Date()` é UTC, e nos clientes o
 * `.toISOString()` também converte para UTC — ambos adiantam ~3h o relógio no
 * Brasil. Estes helpers formatam o instante atual SEMPRE no fuso de Brasília,
 * independentemente do fuso do servidor ou do navegador.
 *
 * Use para preencher defaults de formulários (inputs date / datetime-local) e
 * para calcular "hoje" no servidor. Para EXIBIR datas já gravadas, continue
 * usando formatDate() (que apenas fatia a string ISO, sem conversão de fuso).
 */

const TZ = "America/Sao_Paulo"

/** Hoje em Brasília no formato YYYY-MM-DD (para inputs `type="date"` e "hoje"). */
export function hojeBrasilia(): string {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date())
}

/** Data+hora "agora" em Brasília p/ EXIBIÇÃO (ex.: "11/06/2026, 21:57:31"). */
export function agoraBrasiliaDataHora(): string {
  return new Date().toLocaleString("pt-BR", { timeZone: TZ })
}

/** Data "agora" em Brasília p/ EXIBIÇÃO (ex.: "11/06/2026"). */
export function agoraBrasiliaData(): string {
  return new Date().toLocaleDateString("pt-BR", { timeZone: TZ })
}

/**
 * Formata um timestamp ISO já gravado (TIMESTAMPTZ) p/ EXIBIÇÃO no fuso de
 * Brasília: "18/06/2026 20:30". Use no lugar de `new Date(iso).toLocaleString()`,
 * que no servidor (UTC) adianta ~3h. Para campos SÓ-data use formatDate() (slice).
 */
export function formatDataHora(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
}

/** Agora em Brasília no formato YYYY-MM-DDTHH:mm (para inputs `type="datetime-local"`). */
export function agoraBrasiliaInput(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date())
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "00"
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}`
}

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

/**
 * Lógica pura das notificações de vencimento (sem I/O — testável).
 *
 * Estratégia de marcos: em vez de mandar um digest todo dia (spam), alertamos
 * quando um item cruza um marco de antecedência. Rodando a cron 1×/dia, cada
 * item entra no e-mail exatamente nos dias em que faltam 30, 15 ou 7 dias para
 * vencer. Não exige tabela de estado "já notifiquei".
 */

import { brand } from "@/config/brand"

export type VencimentoRow = {
  categoria: string
  item: string
  colaborador: string | null
  empresa_id: string | null
  data_vencimento: string
  dias_restantes: number
  urgencia: string
}

export const MARCOS_NOTIFICACAO = [30, 15, 7] as const

const CATEGORIA_LABEL: Record<string, string> = {
  exame_medico: "Exame médico",
  treinamento: "Treinamento",
  epi_ca: "CA de EPI",
}

/** Itens cujo `dias_restantes` bate exatamente um marco de antecedência. */
export function selecionarNotificaveis(
  rows: VencimentoRow[],
  marcos: readonly number[] = MARCOS_NOTIFICACAO,
): VencimentoRow[] {
  return rows.filter((r) => marcos.includes(r.dias_restantes))
}

/** Vencimentos pertinentes a uma empresa (inclui itens globais, ex.: CA de EPI). */
export function filtrarParaEmpresa(rows: VencimentoRow[], empresaId: string | null): VencimentoRow[] {
  return rows.filter((r) => r.empresa_id === empresaId || r.empresa_id === null)
}

export function montarAssunto(rows: VencimentoRow[]): string {
  const n = rows.length
  const maisUrgente = Math.min(...rows.map((r) => r.dias_restantes))
  return `[SST] ${n} ${n === 1 ? "item vence" : "itens vencem"} em breve (o mais próximo em ${maisUrgente} dias)`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatDateBr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}

/** Monta o corpo HTML do e-mail, agrupando por marco (mais urgente primeiro). */
export function montarEmailHtml(
  rows: VencimentoRow[],
  opts: { appUrl?: string } = {},
): string {
  const ordenado = [...rows].sort((a, b) => a.dias_restantes - b.dias_restantes)

  const linhas = ordenado
    .map((r) => {
      const cat = CATEGORIA_LABEL[r.categoria] ?? r.categoria
      const cor = r.dias_restantes <= 7 ? "#dc2626" : r.dias_restantes <= 15 ? "#ea580c" : "#ca8a04"
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">${escapeHtml(cat)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px">${escapeHtml(r.item)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px">${escapeHtml(r.colaborador ?? "—")}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px">${formatDateBr(r.data_vencimento)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;color:${cor}">${r.dias_restantes} dias</td>
      </tr>`
    })
    .join("")

  const link = opts.appUrl
    ? `<p style="margin-top:16px"><a href="${escapeHtml(opts.appUrl)}/vencimentos" style="color:#2563eb">Ver todos os vencimentos →</a></p>`
    : ""

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#111827">
    <h2 style="font-size:18px">Vencimentos próximos — SST Manager</h2>
    <p style="font-size:14px;color:#374151">Os itens abaixo precisam de atenção. Renove-os antes do vencimento para manter a conformidade.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">
      <thead>
        <tr style="text-align:left;background:#f9fafb">
          <th style="padding:8px;font-size:12px;color:#6b7280;text-transform:uppercase">Categoria</th>
          <th style="padding:8px;font-size:12px;color:#6b7280;text-transform:uppercase">Item</th>
          <th style="padding:8px;font-size:12px;color:#6b7280;text-transform:uppercase">Colaborador</th>
          <th style="padding:8px;font-size:12px;color:#6b7280;text-transform:uppercase">Vencimento</th>
          <th style="padding:8px;font-size:12px;color:#6b7280;text-transform:uppercase">Faltam</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
    ${link}
    <p style="margin-top:24px;font-size:12px;color:#9ca3af">E-mail automático do ${brand.appName}${brand.companyName ? ` — ${brand.companyName}` : ""}. Não responda.</p>
  </div>`
}

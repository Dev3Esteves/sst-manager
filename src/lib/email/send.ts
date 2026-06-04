/**
 * Envio de e-mail transacional via Resend (HTTP API, sem SDK).
 *
 * Graceful por design: sem `RESEND_API_KEY` configurada, não envia — apenas
 * loga e retorna `{ ok: false, skipped: true }`. Mesmo padrão da feature de
 * IA (ANTHROPIC_API_KEY): a funcionalidade é opcional e não derruba o resto.
 */
import { logger } from "@/lib/logger"

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped?: boolean; error?: string }

const RESEND_ENDPOINT = "https://api.resend.com/emails"

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = input.from ?? process.env.EMAIL_FROM ?? "SST Manager <onboarding@resend.dev>"
  const to = Array.isArray(input.to) ? input.to : [input.to]

  if (!apiKey) {
    logger.warn("RESEND_API_KEY não configurada — e-mail não enviado", {
      subject: input.subject,
      recipients: to.length,
    })
    return { ok: false, skipped: true }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject: input.subject, html: input.html }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return { ok: false, error: `Resend HTTP ${res.status}: ${text.slice(0, 200)}` }
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

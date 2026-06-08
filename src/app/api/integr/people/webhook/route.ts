/**
 * Webhook receiver do People (RH).
 *
 * Autenticação: HMAC-SHA256 do corpo bruto no header `x-people-signature`,
 * validado contra PEOPLE_WEBHOOK_SECRET. Idempotência: cada `event_id` é
 * processado uma única vez (tabela integr_evento). Aplica a mudança via
 * anti-corruption layer (service role).
 *
 * Respostas: 401 assinatura inválida · 400 payload inválido ·
 * 422 erro de dados (não retentar) · 200 processado/idempotente.
 */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { withRouteLogging } from "@/lib/logger"
import { verificarAssinatura } from "@/lib/integracao/people/assinatura"
import {
  peopleEventoSchema,
  peopleCargoSchema,
  peopleColaboradorSchema,
  peopleDeleteSchema,
} from "@/lib/integracao/people/contrato"
import { upsertCargo, upsertColaborador, desativarPorExternalId } from "@/lib/integracao/people/sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  return withRouteLogging("integr/people/webhook", req, async (log) => {
    const segredo = process.env.PEOPLE_WEBHOOK_SECRET
    if (!segredo) {
      log.error("PEOPLE_WEBHOOK_SECRET não configurado")
      return NextResponse.json({ error: "Integração não configurada" }, { status: 503 })
    }

    const raw = await req.text()
    if (!verificarAssinatura(raw, req.headers.get("x-people-signature"), segredo)) {
      log.warn("assinatura inválida")
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
    }

    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    const parsed = peopleEventoSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Evento inválido", issues: parsed.error.flatten() }, { status: 400 })
    }
    const evento = parsed.data
    const scoped = log.child({ eventId: evento.event_id, eventType: evento.event_type })

    const admin = createAdminClient()

    // Idempotência
    const { data: existente } = await admin
      .from("integr_evento").select("event_id, status").eq("event_id", evento.event_id).maybeSingle()
    if (existente?.status === "processado") {
      scoped.info("evento já processado (idempotente)")
      return NextResponse.json({ ok: true, idempotente: true })
    }

    try {
      switch (evento.event_type) {
        case "cargo.upserted":
          await upsertCargo(admin, peopleCargoSchema.parse(evento.data)); break
        case "cargo.deleted":
          await desativarPorExternalId(admin, "cargos", peopleDeleteSchema.parse(evento.data).external_id); break
        case "colaborador.upserted":
          await upsertColaborador(admin, peopleColaboradorSchema.parse(evento.data)); break
        case "colaborador.deleted":
          await desativarPorExternalId(admin, "colaboradores", peopleDeleteSchema.parse(evento.data).external_id); break
      }
    } catch (err) {
      const msg = (err as Error).message
      scoped.exception("falha ao aplicar evento", err)
      await admin.from("integr_evento").upsert({
        event_id: evento.event_id, tipo: evento.event_type, status: "erro", detalhe: msg.slice(0, 500),
      })
      return NextResponse.json({ ok: false, error: msg }, { status: 422 })
    }

    await admin.from("integr_evento").upsert({
      event_id: evento.event_id, tipo: evento.event_type, status: "processado", detalhe: null,
    })
    scoped.info("evento aplicado")
    return NextResponse.json({ ok: true })
  })
}

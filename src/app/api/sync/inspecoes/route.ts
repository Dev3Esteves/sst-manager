import { NextResponse } from "next/server"
import { requireAuth, authErrorToResponse } from "@/lib/auth/guards"
import { inspecaoSchema, calcConformidade } from "@/lib/validations/inspecao"
import { withRouteLogging } from "@/lib/logger"

export async function POST(req: Request) {
  return withRouteLogging("sync/inspecoes", req, async (log) => {
    const body = await req.json().catch(() => null)
    if (!body) {
      log.warn("invalid body")
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const parsed = inspecaoSchema.safeParse(body)
    if (!parsed.success) {
      log.warn("schema validation failed", { issue: parsed.error.errors[0]?.message })
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    let supabase, user
    try {
      ;({ supabase, user } = await requireAuth())
    } catch (e) {
      const resp = authErrorToResponse(e); if (resp) return resp
      throw e
    }

    const scoped = log.child({
      userId: user.id,
      empresaId: parsed.data.empresa_id,
      templateId: parsed.data.template_id,
    })

    const { data: link } = await supabase
      .from("usuarios").select("colaborador_id").eq("id", user.id).single()

    const percentual = calcConformidade(parsed.data.respostas)

    const { data, error } = await supabase.from("inspecoes").insert({
      template_id: parsed.data.template_id,
      empresa_id: parsed.data.empresa_id,
      inspetor_id: parsed.data.inspetor_id ?? link?.colaborador_id ?? null,
      local: parsed.data.local,
      data_inspecao: parsed.data.data_inspecao,
      respostas: parsed.data.respostas,
      obra_local_id: parsed.data.obra_local_id ?? null,
      percentual_conformidade: percentual,
      observacoes_gerais: parsed.data.observacoes_gerais,
      status: "concluida",
    }).select("id").single()

    if (error) {
      scoped.exception("insert falhou", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    scoped.info("inspecao persistida", { id: data.id, percentual })
    return NextResponse.json({ id: data.id, percentual }, { status: 201 })
  })
}

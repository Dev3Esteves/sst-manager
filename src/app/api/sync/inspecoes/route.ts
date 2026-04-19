import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { inspecaoSchema, calcConformidade } from "@/lib/validations/inspecao"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 })

  const parsed = inspecaoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

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
    percentual_conformidade: percentual,
    observacoes_gerais: parsed.data.observacoes_gerais,
    status: "concluida",
  }).select("id").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, percentual }, { status: 201 })
}

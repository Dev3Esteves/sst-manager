import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { classificarRisco, IAServiceUnavailable } from "@/lib/ia/classificar-risco"

const bodySchema = z.object({
  atividade: z.string().min(3, "Descreva a atividade (mínimo 3 caracteres)"),
  perigo: z.string().min(3, "Descreva o perigo (mínimo 3 caracteres)"),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Payload inválido" },
      { status: 400 },
    )
  }

  try {
    const result = await classificarRisco(parsed.data)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    if (err instanceof IAServiceUnavailable) {
      return NextResponse.json(
        {
          error: "IA não configurada",
          detail: "Adicione ANTHROPIC_API_KEY em .env.local e reinicie o dev server para ativar sugestões de IA.",
        },
        { status: 503 },
      )
    }
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

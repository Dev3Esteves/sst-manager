/**
 * GET /api/integr/v1/seguranca/epis?cpf=...
 * EPIs entregues a um colaborador (NR-6), para o Sistenge People consultar
 * (SST é a fonte de EPIs). Auth por API key (PEOPLE_API_KEY).
 */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verificarApiKeyPeople } from "@/lib/integracao/people/auth-leitura"
import { formatCPF } from "@/lib/validations/shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function statusCa(caValidade: string | null): "valido" | "vencido" | "substituir" {
  if (!caValidade) return "valido"
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(caValidade.slice(0, 10) + "T00:00:00")
  const dias = Math.round((venc.getTime() - hoje.getTime()) / 86400000)
  if (dias < 0) return "vencido"
  if (dias <= 30) return "substituir"
  return "valido"
}

export async function GET(req: Request) {
  if (!verificarApiKeyPeople(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const cpfRaw = new URL(req.url).searchParams.get("cpf")
  if (!cpfRaw) return NextResponse.json({ error: "Parâmetro cpf obrigatório" }, { status: 400 })
  const cpfLimpo = cpfRaw.replace(/\D/g, "")

  const admin = createAdminClient()
  const { data: colab } = await admin
    .from("colaboradores")
    .select("id")
    .in("cpf", [cpfLimpo, formatCPF(cpfLimpo)])
    .maybeSingle()

  if (!colab) return NextResponse.json({ cpf: cpfLimpo, itens: [] })

  const { data: entregas } = await admin
    .from("epi_entregas")
    .select("data_entrega, epis(ca, descricao, ca_validade)")
    .eq("colaborador_id", colab.id)
    .order("data_entrega", { ascending: false })

  const itens = (entregas ?? []).map((e) => {
    const epi = Array.isArray(e.epis) ? e.epis[0] : e.epis
    return {
      ca: epi?.ca ?? "",
      descricao: epi?.descricao ?? "",
      data_entrega: e.data_entrega,
      data_validade: epi?.ca_validade ?? null,
      status: statusCa(epi?.ca_validade ?? null),
    }
  })

  return NextResponse.json({ cpf: cpfLimpo, itens })
}

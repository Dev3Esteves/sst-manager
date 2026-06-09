/**
 * GET /api/integr/v1/saude/aso?cpf=...
 * Status do ASO (exame médico) mais recente de um colaborador, para o
 * People (RH) consultar (SST é a fonte de ASO/saúde ocupacional).
 * Auth por API key (PEOPLE_API_KEY).
 */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verificarApiKeyPeople } from "@/lib/integracao/people/auth-leitura"
import { formatCPF } from "@/lib/validations/shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TIPO_MAP: Record<string, string> = { retorno_trabalho: "retorno" }

function statusPorVencimento(dataVencimento: string | null, statusReg: string | null): string {
  if (!dataVencimento) return "nao_realizado"
  if (statusReg === "vencido") return "vencido"
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVencimento.slice(0, 10) + "T00:00:00")
  return venc.getTime() >= hoje.getTime() ? "valido" : "vencido"
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

  if (!colab) {
    return NextResponse.json({
      cpf: cpfLimpo, status: "nao_realizado",
      data_realizacao: null, data_validade: null, tipo: null, medico_responsavel: null,
    })
  }

  const { data: exame } = await admin
    .from("exames_medicos")
    .select("tipo, data_realizacao, data_vencimento, medico_nome, status")
    .eq("colaborador_id", colab.id)
    .order("data_realizacao", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!exame) {
    return NextResponse.json({
      cpf: cpfLimpo, status: "nao_realizado",
      data_realizacao: null, data_validade: null, tipo: null, medico_responsavel: null,
    })
  }

  return NextResponse.json({
    cpf: cpfLimpo,
    status: statusPorVencimento(exame.data_vencimento, exame.status),
    data_realizacao: exame.data_realizacao,
    data_validade: exame.data_vencimento,
    tipo: TIPO_MAP[exame.tipo] ?? exame.tipo,
    medico_responsavel: exame.medico_nome ?? null,
  })
}

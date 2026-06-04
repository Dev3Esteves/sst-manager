"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { respostaPsiSchema, type RespostaPsiInput } from "@/lib/validations/psicossocial"

/**
 * Submissão ANÔNIMA de uma resposta de questionário psicossocial.
 *
 * Roda via service role (bypassa RLS) porque o respondente não está
 * autenticado. Valida o token do convite e exige campanha 'aberta'. NUNCA
 * grava qualquer vínculo com a pessoa — só campanha + GHE.
 */
export async function submeterResposta(
  input: RespostaPsiInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = respostaPsiSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" }
  }

  const admin = createAdminClient()

  const { data: convite } = await admin
    .from("psi_convite")
    .select("campanha_id, pgr_ghe_id, empresa_id, psi_campanha(status)")
    .eq("token", parsed.data.token)
    .maybeSingle()

  if (!convite) return { ok: false, error: "Link inválido ou expirado." }

  const campanha = Array.isArray(convite.psi_campanha) ? convite.psi_campanha[0] : convite.psi_campanha
  if (campanha?.status !== "aberta") {
    return { ok: false, error: "Esta pesquisa não está aberta para respostas no momento." }
  }

  const { data: resp, error } = await admin
    .from("psi_resposta")
    .insert({
      empresa_id: convite.empresa_id,
      campanha_id: convite.campanha_id,
      pgr_ghe_id: convite.pgr_ghe_id,
      faixa_etaria: parsed.data.faixa_etaria ?? null,
      sexo: parsed.data.sexo ?? null,
    })
    .select("id")
    .single()

  if (error || !resp) return { ok: false, error: error?.message ?? "Falha ao registrar." }

  const itens = parsed.data.itens.map((i) => ({
    resposta_id: resp.id,
    item_id: i.item_id,
    valor: i.valor,
  }))
  const { error: e2 } = await admin.from("psi_resposta_item").insert(itens)
  if (e2) return { ok: false, error: e2.message }

  return { ok: true }
}

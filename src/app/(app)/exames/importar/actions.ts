"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { z } from "zod"
import type { exameImportZod } from "@/lib/import/schemas"

export async function importarExames(rows: z.infer<typeof exameImportZod>[]) {
  const supabase = await createClient()
  const erros: string[] = []
  let inseridos = 0

  // Resolve colaborador_id por CPF batched
  const { data: colaboradores } = await supabase
    .from("colaboradores")
    .select("id, cpf, nome_completo")

  const colabByCpf = new Map<string, { id: string; nome: string }>()
  for (const c of colaboradores ?? []) {
    colabByCpf.set(c.cpf.replace(/\D/g, ""), { id: c.id, nome: c.nome_completo })
  }

  for (const r of rows) {
    const cpfDigits = r.colaborador_cpf.replace(/\D/g, "")
    const colab = colabByCpf.get(cpfDigits)
    if (!colab) {
      erros.push(`CPF ${r.colaborador_cpf}: colaborador não cadastrado`)
      continue
    }

    // Não há unique constraint em exames — a mesma pessoa pode ter vários exames
    // do mesmo tipo ao longo do tempo. Inserimos sempre e deixamos a UI mostrar.
    // Mas para evitar 100% duplicação acidental, verificamos data_realizacao + tipo.
    const { data: existente } = await supabase
      .from("exames_medicos")
      .select("id")
      .eq("colaborador_id", colab.id)
      .eq("tipo", r.tipo)
      .eq("data_realizacao", r.data_realizacao)
      .maybeSingle()

    if (existente) {
      // Atualiza o existente (idempotência)
      const { error } = await supabase.from("exames_medicos").update({
        subtipo: r.subtipo || null,
        data_vencimento: r.data_vencimento,
        resultado: r.resultado || null,
        restricoes: r.restricoes || null,
        medico_nome: r.medico_nome || null,
        crm: r.crm || null,
        clinica: r.clinica || null,
        numero_aso: r.numero_aso || null,
        observacoes: r.observacoes || null,
      }).eq("id", existente.id)
      if (error) {
        erros.push(`${colab.nome}: ${error.message}`)
      } else {
        inseridos++
      }
    } else {
      const { error } = await supabase.from("exames_medicos").insert({
        colaborador_id: colab.id,
        tipo: r.tipo,
        subtipo: r.subtipo || null,
        data_realizacao: r.data_realizacao,
        data_vencimento: r.data_vencimento,
        resultado: r.resultado || null,
        restricoes: r.restricoes || null,
        medico_nome: r.medico_nome || null,
        crm: r.crm || null,
        clinica: r.clinica || null,
        numero_aso: r.numero_aso || null,
        observacoes: r.observacoes || null,
        status: "vigente",
      })
      if (error) {
        erros.push(`${colab.nome}: ${error.message}`)
      } else {
        inseridos++
      }
    }
  }

  revalidatePath("/exames")
  revalidatePath("/vencimentos")
  return { inseridos, erros }
}

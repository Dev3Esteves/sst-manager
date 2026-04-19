"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { z } from "zod"
import type { cargoImportZod } from "@/lib/import/schemas"

export async function importarCargos(rows: z.infer<typeof cargoImportZod>[]) {
  const supabase = await createClient()
  const erros: string[] = []
  let inseridos = 0

  // Resolve empresa_id por CNPJ batched
  const { data: empresas } = await supabase.from("empresas").select("id, cnpj")
  const empresaByCnpj = new Map<string, string>()
  for (const e of empresas ?? []) {
    empresaByCnpj.set(e.cnpj.replace(/\D/g, ""), e.id)
  }

  for (const r of rows) {
    const cnpjDigits = r.empresa_cnpj.replace(/\D/g, "")
    const empresaId = empresaByCnpj.get(cnpjDigits)
    if (!empresaId) {
      erros.push(`${r.titulo}: empresa com CNPJ ${r.empresa_cnpj} não cadastrada`)
      continue
    }

    // Busca cargo existente por titulo + empresa (case-insensitive)
    const { data: existente } = await supabase
      .from("cargos")
      .select("id")
      .ilike("titulo", r.titulo)
      .eq("empresa_id", empresaId)
      .maybeSingle()

    const payload = {
      titulo: r.titulo,
      empresa_id: empresaId,
      cbo: r.cbo || null,
      grupo_risco: r.grupo_risco ?? null,
      descricao_atividades: r.descricao_atividades || null,
      nrs_aplicaveis: r.nrs_aplicaveis ?? [],
    }

    const { error } = existente
      ? await supabase.from("cargos").update(payload).eq("id", existente.id)
      : await supabase.from("cargos").insert(payload)

    if (error) {
      erros.push(`${r.titulo}: ${error.message}`)
    } else {
      inseridos++
    }
  }

  revalidatePath("/cargos")
  return { inseridos, erros }
}

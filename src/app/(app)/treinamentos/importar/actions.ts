"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { z } from "zod"
import type { treinamentoImportZod } from "@/lib/import/schemas"

export async function importarTreinamentos(rows: z.infer<typeof treinamentoImportZod>[]) {
  const supabase = await createClient()
  const erros: string[] = []
  let inseridos = 0

  // Treinamentos não têm unique constraint — fazemos lookup por titulo+nr_referencia e update/insert
  for (const r of rows) {
    // Busca existente por título (case-insensitive) + NR (ou ausência)
    const { data: existente } = await supabase
      .from("treinamentos")
      .select("id")
      .ilike("titulo", r.titulo)
      .eq("nr_referencia", r.nr_referencia ?? null)
      .maybeSingle()

    const payload = {
      titulo: r.titulo,
      nr_referencia: r.nr_referencia || null,
      carga_horaria_horas: r.carga_horaria_horas,
      validade_meses: r.validade_meses ?? null,
      tipo: r.tipo,
      modalidade: r.modalidade,
    }

    const { error } = existente
      ? await supabase.from("treinamentos").update(payload).eq("id", existente.id)
      : await supabase.from("treinamentos").insert(payload)

    if (error) {
      erros.push(`${r.titulo}: ${error.message}`)
    } else {
      inseridos++
    }
  }

  revalidatePath("/treinamentos")
  return { inseridos, erros }
}

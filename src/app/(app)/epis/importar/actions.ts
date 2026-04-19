"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { z } from "zod"
import type { epiImportZod } from "@/lib/import/schemas"

export async function importarEpis(rows: z.infer<typeof epiImportZod>[]) {
  const supabase = await createClient()
  const erros: string[] = []
  let inseridos = 0

  for (const r of rows) {
    const { error } = await supabase.from("epis").upsert({
      descricao: r.descricao,
      ca: r.ca,
      ca_validade: r.ca_validade || null,
      fabricante: r.fabricante || null,
      tipo: r.tipo || null,
    }, { onConflict: "ca" })

    if (error) {
      erros.push(`CA ${r.ca}: ${error.message}`)
    } else {
      inseridos++
    }
  }

  revalidatePath("/epis")
  return { inseridos, erros }
}

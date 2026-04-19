"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { z } from "zod"
import type { empresaImportZod } from "@/lib/import/schemas"

export async function importarEmpresas(rows: z.infer<typeof empresaImportZod>[]) {
  const supabase = await createClient()
  const erros: string[] = []
  let inseridos = 0

  for (const r of rows) {
    const cnpjDigits = r.cnpj.replace(/\D/g, "")

    // Upsert por CNPJ — se já existir, atualiza
    const { error } = await supabase.from("empresas").upsert({
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia || null,
      cnpj: `${cnpjDigits.slice(0, 2)}.${cnpjDigits.slice(2, 5)}.${cnpjDigits.slice(5, 8)}/${cnpjDigits.slice(8, 12)}-${cnpjDigits.slice(12)}`,
      tipo: r.tipo,
      inscricao_estadual: r.inscricao_estadual || null,
      ativo: true,
    }, { onConflict: "cnpj" })

    if (error) {
      erros.push(`CNPJ ${r.cnpj}: ${error.message}`)
    } else {
      inseridos++
    }
  }

  revalidatePath("/empresas")
  return { inseridos, erros }
}

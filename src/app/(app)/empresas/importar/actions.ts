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
    const { data: up, error } = await supabase.from("empresas").upsert({
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia || null,
      cnpj: `${cnpjDigits.slice(0, 2)}.${cnpjDigits.slice(2, 5)}.${cnpjDigits.slice(5, 8)}/${cnpjDigits.slice(8, 12)}-${cnpjDigits.slice(12)}`,
      tipo: r.tipo,
      propria: r.tipo === "propria",
      inscricao_estadual: r.inscricao_estadual || null,
      ativo: true,
    }, { onConflict: "cnpj" }).select("id").single()

    if (error || !up) {
      erros.push(`CNPJ ${r.cnpj}: ${error?.message ?? "falha"}`)
    } else {
      // Reflete o tipo importado como papel (modelo Parceiro de Negócio).
      const papel = r.tipo === "propria" ? "propria" : r.tipo === "contratante" ? "cliente" : "prestadora"
      await supabase
        .from("empresa_papeis")
        .upsert({ empresa_id: up.id, papel }, { onConflict: "empresa_id,papel", ignoreDuplicates: true })
      inseridos++
    }
  }

  revalidatePath("/empresas")
  return { inseridos, erros }
}

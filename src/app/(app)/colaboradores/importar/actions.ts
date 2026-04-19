"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { z } from "zod"
import type { colaboradorImportZod } from "@/lib/import/schemas"

export async function importarColaboradores(rows: z.infer<typeof colaboradorImportZod>[]) {
  const supabase = await createClient()
  const erros: string[] = []
  let inseridos = 0

  // Resolve empresa_id por CNPJ e cargo_id por titulo — batched para eficiência
  const titulosCargos = Array.from(new Set(rows.map((r) => r.cargo_titulo).filter(Boolean) as string[]))

  // Fetch todas empresas que vamos precisar (com CNPJ normalizado)
  const { data: empresas } = await supabase
    .from("empresas")
    .select("id, cnpj, razao_social")

  const empresaByCnpj = new Map<string, string>()
  for (const e of empresas ?? []) {
    const digits = e.cnpj.replace(/\D/g, "")
    empresaByCnpj.set(digits, e.id)
  }

  // Fetch cargos
  const { data: cargos } = titulosCargos.length > 0
    ? await supabase.from("cargos").select("id, titulo").in("titulo", titulosCargos)
    : { data: [] as { id: string; titulo: string }[] }

  const cargoByTitulo = new Map<string, string>()
  for (const c of cargos ?? []) cargoByTitulo.set(c.titulo.toLowerCase().trim(), c.id)

  for (const r of rows) {
    const cnpjDigits = r.empresa_cnpj.replace(/\D/g, "")
    const empresaId = empresaByCnpj.get(cnpjDigits)
    if (!empresaId) {
      erros.push(`${r.nome_completo}: empresa com CNPJ ${r.empresa_cnpj} não cadastrada`)
      continue
    }

    const cargoId = r.cargo_titulo ? cargoByTitulo.get(r.cargo_titulo.toLowerCase().trim()) : null
    // Cargo inexistente não bloqueia — apenas fica sem vínculo

    const cpfDigits = r.cpf.replace(/\D/g, "")
    const cpfFormatado = `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9)}`

    const { error } = await supabase.from("colaboradores").upsert({
      empresa_id: empresaId,
      nome_completo: r.nome_completo,
      cpf: cpfFormatado,
      rg: r.rg || null,
      data_nascimento: r.data_nascimento || null,
      sexo: r.sexo || null,
      telefone: r.telefone || null,
      email: r.email || null,
      matricula: r.matricula || null,
      data_admissao: r.data_admissao,
      tipo_vinculo: r.tipo_vinculo,
      cargo_id: cargoId,
      status: "ativo",
    }, { onConflict: "cpf" })

    if (error) {
      erros.push(`${r.nome_completo} (${r.cpf}): ${error.message}`)
    } else {
      inseridos++
    }
  }

  revalidatePath("/colaboradores")
  return { inseridos, erros }
}

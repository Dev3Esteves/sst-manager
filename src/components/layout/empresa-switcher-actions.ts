"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ok, err, type Result } from "@/lib/result"

/**
 * Define a empresa ativa do usuário autenticado. Valida que a empresa pertence
 * ao usuário (via `usuario_empresas`, restrito por RLS) antes de gravar.
 * Toda a navegação/RLS passa a refletir a nova empresa, pois `user_empresa_id()`
 * retorna `empresa_ativa_id`.
 */
export async function definirEmpresaAtiva(empresaId: string): Promise<Result<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err("Não autenticado")

  // O usuário só enxerga (RLS) os próprios vínculos — confirma a permissão.
  const { data: vinculo } = await supabase
    .from("usuario_empresas")
    .select("empresa_id")
    .eq("usuario_id", user.id)
    .eq("empresa_id", empresaId)
    .maybeSingle()
  if (!vinculo) return err("Empresa não permitida para este usuário")

  // Grava via service role (a permissão já foi confirmada acima).
  const admin = createAdminClient()
  const { error } = await admin
    .from("usuarios")
    .update({ empresa_ativa_id: empresaId })
    .eq("id", user.id)
  if (error) return err(error.message)

  revalidatePath("/", "layout")
  return ok()
}

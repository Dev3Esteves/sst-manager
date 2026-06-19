import { createAdminClient } from "@/lib/supabase/admin"

/**
 * First-run guard: a Organização (singleton) ainda não foi configurada.
 *
 * true quando a tabela `organizacao` está vazia — instância recém-criada que
 * ainda não passou pelo setup inicial da conta/marca. Lê via service role
 * (admin client) para não depender de RLS/sessão. Em caso de erro, retorna
 * false (não bloqueia o app por uma falha de leitura).
 */
export async function precisaSetupOrganizacao(): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("organizacao").select("id").limit(1).maybeSingle()
    return !data
  } catch {
    return false
  }
}

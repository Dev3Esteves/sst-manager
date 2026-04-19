// Cliente Supabase com service_role — bypassa RLS.
// CRÍTICO: SÓ usar em Server Actions ou Route Handlers. Nunca importar em client components.

import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Necessária para administração de usuários.",
    )
  }

  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

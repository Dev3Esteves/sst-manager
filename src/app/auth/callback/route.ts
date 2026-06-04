import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Callback de autenticação (PKCE). O Supabase redireciona pra cá com `?code=`
 * após o usuário clicar no link de recuperação de senha enviado por e-mail.
 * Trocamos o code por uma sessão (grava cookies) e seguimos para `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // Só permitimos caminhos internos em `next` (evita open redirect)
  const nextRaw = searchParams.get("next") ?? "/dashboard"
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?erro=link_expirado`)
}

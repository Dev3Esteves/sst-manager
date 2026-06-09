import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { moduloExigidoParaRota } from '@/lib/treinamento/modulos-app'

type CookieItem = { name: string; value: string; options?: CookieOptions }

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login') ||
    pathname.startsWith('/recuperar-senha')
  // Rotas de cron se autenticam pelo CRON_SECRET no próprio handler. Não podem
  // ser redirecionadas para /login — senão o Vercel Cron (que chama sem cookie
  // de sessão) nunca alcança o handler. Vale para process-jobs e notificar-vencimentos.
  const isCronRoute = pathname.startsWith('/api/cron')
  // Coleta anônima do questionário psicossocial (link/QR público, sem sessão).
  const isColetaPsi = pathname.startsWith('/q/')
  // Integração com o People (RH) — autentica por HMAC (webhook) ou API key
  // (leitura) no próprio handler; não passa pela sessão de usuário.
  const isIntegrRoute = pathname.startsWith('/api/integr')
  const isPublicRoute = isAuthRoute || isCronRoute || isColetaPsi || isIntegrRoute || pathname === '/'

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Trava de treinamento ──────────────────────────────────────────────────
  // Em navegações GET para um módulo travado, o usuário só passa se concluiu o
  // treinamento (ou é admin/isento/está na carência). Só roda quando a rota tem
  // módulo exigido (registry), economizando round-trips no resto.
  if (user && !isPublicRoute && request.method === 'GET') {
    const exigido = moduloExigidoParaRota(pathname)
    if (exigido) {
      const { data: status } = await supabase.rpc('treinamento_status_modulo', { p_slug: exigido.slug })
      if (status === 'bloqueado') {
        const url = request.nextUrl.clone()
        url.pathname = `/treinamento/${exigido.slug}`
        url.search = `?bloqueio=${encodeURIComponent(pathname)}`
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

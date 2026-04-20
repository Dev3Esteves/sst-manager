/**
 * Helpers de autorização centralizados.
 *
 * Dois estilos, escolhidos pelo contexto:
 *  - `requireAuth()` / `requireRole()` / `requireAdmin()`
 *      LANÇAM `AuthError` se falharem — ideais para Server Actions e route
 *      handlers, onde o erro vira 401/403 ou resposta de erro ao cliente.
 *
 *  - `getAuth()` / `getAuthWithRole()`
 *      Retornam `null` se falharem — ideais para Server Components que
 *      renderizam UI diferente para não-autorizados (não queremos um throw
 *      que gera página de erro).
 *
 * Todos os helpers já retornam o `supabase` client + `user` + `perfil` numa
 * única chamada — evita criar clients extras no chamador.
 */

import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient, User } from "@supabase/supabase-js"

// Reutilizado para não importar/exportar tipos genéricos desnecessariamente
/* eslint-disable @typescript-eslint/no-explicit-any */
type SupabaseServer = SupabaseClient<any, "public", any>
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Perfis de acesso conhecidos no sistema (espelha `perfis_acesso.nome`). */
export const PERFIS = [
  "admin",
  "engenheiro_seg",
  "tec_seguranca",
  "rh_administrativo",
  "gestor_diretoria",
  "encarregado_campo",
  "colaborador",
] as const
export type PerfilNome = (typeof PERFIS)[number]

/**
 * Contexto de autenticação resolvido: supabase + user + perfil (se houver).
 * Perfil pode ser `null` em usuários recém-criados sem vínculo em `usuarios`.
 */
export type AuthContext = {
  supabase: SupabaseServer
  user: User
  perfil: PerfilNome | null
}

/** Erro lançado quando não há usuário autenticado ou não tem o papel esperado. */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(message)
    this.name = "AuthError"
  }
}

/**
 * Resolve o perfil do usuário autenticado via RPC `user_perfil_nome`.
 * Exportado para testes; normalmente use `getAuth()` ou `requireAuth()`.
 */
async function resolverPerfil(supabase: SupabaseServer): Promise<PerfilNome | null> {
  const { data } = await supabase.rpc("user_perfil_nome")
  if (typeof data !== "string") return null
  return (PERFIS as readonly string[]).includes(data) ? (data as PerfilNome) : null
}

// --------------------------------------------------------------------------
// Não-lançantes (para Server Components)
// --------------------------------------------------------------------------

/**
 * Retorna o contexto de auth se houver usuário logado, senão `null`.
 * Útil em Server Components que querem renderizar UI de "não autenticado"
 * sem causar throw.
 */
export async function getAuth(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const perfil = await resolverPerfil(supabase)
  return { supabase, user, perfil }
}

/**
 * Como `getAuth`, mas também valida se o perfil está na lista.
 * Retorna `null` se não autenticado OU sem papel esperado.
 */
export async function getAuthWithRole(
  roles: readonly PerfilNome[],
): Promise<AuthContext | null> {
  const ctx = await getAuth()
  if (!ctx) return null
  if (!ctx.perfil || !roles.includes(ctx.perfil)) return null
  return ctx
}

/**
 * Resultado discriminado para Server Components que querem distinguir
 * "não autenticado" de "autenticado mas sem papel". Útil para redirecionar
 * pro login no primeiro caso e mostrar mensagem de acesso negado no segundo.
 *
 * @example
 * const r = await checkRole(["admin"])
 * if (r.status === "unauth") redirect("/login")
 * if (r.status === "forbidden") return <AcessoNegado />
 * const { supabase, user } = r.ctx
 */
export type RoleCheckResult =
  | { status: "unauth" }
  | { status: "forbidden"; perfilAtual: PerfilNome | null }
  | { status: "ok"; ctx: AuthContext }

export async function checkRole(roles: readonly PerfilNome[]): Promise<RoleCheckResult> {
  const ctx = await getAuth()
  if (!ctx) return { status: "unauth" }
  if (!ctx.perfil || !roles.includes(ctx.perfil)) {
    return { status: "forbidden", perfilAtual: ctx.perfil }
  }
  return { status: "ok", ctx }
}

// --------------------------------------------------------------------------
// Lançantes (para Server Actions / route handlers)
// --------------------------------------------------------------------------

/**
 * Garante que há usuário autenticado. Lança `AuthError('UNAUTHENTICATED')` se não.
 */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuth()
  if (!ctx) throw new AuthError("Não autenticado", "UNAUTHENTICATED")
  return ctx
}

/**
 * Garante que o usuário autenticado tem pelo menos um dos perfis listados.
 * Lança `AuthError` se não autenticado ou sem o papel.
 */
export async function requireRole(
  roles: readonly PerfilNome[],
  opts: { mensagem?: string } = {},
): Promise<AuthContext> {
  const ctx = await requireAuth()
  if (!ctx.perfil || !roles.includes(ctx.perfil)) {
    throw new AuthError(
      opts.mensagem ?? `Acesso restrito a: ${roles.join(", ")}`,
      "FORBIDDEN",
    )
  }
  return ctx
}

/**
 * Atalho comum: exige papel `admin`.
 * @example const { supabase } = await requireAdmin()
 */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole(["admin"], { mensagem: "Apenas administradores" })
}

/**
 * Converte um `AuthError` em Response JSON (401/403). Retorna `null` se
 * o erro não for um AuthError — nesse caso o chamador deve re-lançar ou
 * tratar de outra forma.
 *
 * Use em route handlers para reduzir boilerplate:
 *
 * ```ts
 * try {
 *   const { supabase } = await requireAuth()
 *   // ... lógica ...
 * } catch (e) {
 *   const resp = authErrorToResponse(e)
 *   if (resp) return resp
 *   throw e
 * }
 * ```
 */
export function authErrorToResponse(err: unknown): Response | null {
  if (!(err instanceof AuthError)) return null
  const status = err.code === "UNAUTHENTICATED" ? 401 : 403
  return new Response(JSON.stringify({ error: err.message, code: err.code }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

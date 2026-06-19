"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin, AuthError } from "@/lib/auth/guards"
import { ok, err, errFields, type Result } from "@/lib/result"
import {
  criarUsuarioSchema, editarUsuarioSchema, gerarSenhaForte,
  type CriarUsuarioInput, type EditarUsuarioInput,
} from "@/lib/validations/usuario"

/** Converte um AuthError lançado por `requireAdmin()` em Result<never>. */
function authErrorToResult(e: unknown): Result<never> {
  if (e instanceof AuthError) return err(e.message)
  return err(e instanceof Error ? e.message : "Erro desconhecido")
}

/**
 * Sincroniza as empresas que um usuário pode operar (tabela `usuario_empresas`).
 * A empresa principal é sempre incluída. Garante que `empresa_ativa_id`
 * continue válida (∈ conjunto); senão reseta para a principal.
 *
 * Recebe um admin client (service role) — chamado dentro de ações já
 * autorizadas por `requireAdmin()`.
 */
async function sincronizarEmpresasDoUsuario(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  empresaPrincipal: string,
  empresasAdicionais: string[],
): Promise<{ error?: string }> {
  const candidatos = Array.from(new Set([empresaPrincipal, ...empresasAdicionais]))

  // Só empresas próprias podem virar vínculo operável (o trigger do banco
  // rejeitaria não-próprias). Filtra antes de inserir.
  const { data: proprias, error: propErr } = await admin
    .from("empresas")
    .select("id")
    .in("id", candidatos)
    .eq("propria", true)
  if (propErr) return { error: propErr.message }
  const propriasIds = new Set((proprias ?? []).map((e) => (e as { id: string }).id))
  const alvo = candidatos.filter((id) => propriasIds.has(id))
  if (!alvo.includes(empresaPrincipal)) {
    return { error: "A empresa principal precisa ser uma empresa própria." }
  }

  // Remove vínculos que não estão mais no conjunto
  const { error: delErr } = await admin
    .from("usuario_empresas")
    .delete()
    .eq("usuario_id", userId)
    .not("empresa_id", "in", `(${alvo.join(",")})`)
  if (delErr) return { error: delErr.message }

  // Insere/garante os vínculos do conjunto
  const { error: insErr } = await admin
    .from("usuario_empresas")
    .upsert(
      alvo.map((empresa_id) => ({ usuario_id: userId, empresa_id })),
      { onConflict: "usuario_id,empresa_id", ignoreDuplicates: true },
    )
  if (insErr) return { error: insErr.message }

  // Garante que a empresa ativa pertence ao conjunto
  const { data: u } = await admin
    .from("usuarios")
    .select("empresa_ativa_id")
    .eq("id", userId)
    .maybeSingle()
  const ativa = (u as { empresa_ativa_id?: string | null } | null)?.empresa_ativa_id
  if (!ativa || !alvo.includes(ativa)) {
    const { error: updErr } = await admin
      .from("usuarios")
      .update({ empresa_ativa_id: empresaPrincipal })
      .eq("id", userId)
    if (updErr) return { error: updErr.message }
  }
  return {}
}

export async function criarUsuario(
  payload: CriarUsuarioInput,
): Promise<Result<{ senha: string; userId: string }>> {
  try {
    await requireAdmin()
  } catch (e) {
    return authErrorToResult(e)
  }

  const parsed = criarUsuarioSchema.safeParse(payload)
  if (!parsed.success) {
    return errFields(parsed.error.flatten().fieldErrors)
  }

  const admin = createAdminClient()

  // 1. Cria em auth.users via Admin API
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.senha,
    email_confirm: true,
  })

  if (authErr || !created.user) {
    return err(authErr?.message ?? "Falha ao criar usuário em auth")
  }

  // 2. Vincula em public.usuarios (empresa ativa = empresa principal)
  const { error: linkErr } = await admin.from("usuarios").insert({
    id: created.user.id,
    perfil_id: parsed.data.perfil_id,
    empresa_id: parsed.data.empresa_id,
    empresa_ativa_id: parsed.data.empresa_id,
    colaborador_id: parsed.data.colaborador_id ?? null,
    ativo: parsed.data.ativo,
  })

  if (linkErr) {
    // Rollback: tenta deletar o auth.user órfão
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {})
    return err(`Falha ao vincular usuário: ${linkErr.message}`)
  }

  // 3. Sincroniza empresas operáveis (junção usuario_empresas)
  const sync = await sincronizarEmpresasDoUsuario(
    admin, created.user.id, parsed.data.empresa_id, parsed.data.empresas_ids,
  )
  if (sync.error) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {})
    return err(`Falha ao vincular empresas: ${sync.error}`)
  }

  revalidatePath("/usuarios")
  return ok({ senha: parsed.data.senha, userId: created.user.id })
}

export async function editarUsuario(
  id: string, payload: EditarUsuarioInput,
): Promise<Result<void>> {
  try {
    await requireAdmin()
  } catch (e) {
    return authErrorToResult(e)
  }

  const parsed = editarUsuarioSchema.safeParse(payload)
  if (!parsed.success) {
    return errFields(parsed.error.flatten().fieldErrors)
  }

  const admin = createAdminClient()
  const { error } = await admin.from("usuarios").update({
    perfil_id: parsed.data.perfil_id,
    empresa_id: parsed.data.empresa_id,
    colaborador_id: parsed.data.colaborador_id ?? null,
    ativo: parsed.data.ativo,
  }).eq("id", id)

  if (error) return err(error.message)

  const sync = await sincronizarEmpresasDoUsuario(
    admin, id, parsed.data.empresa_id, parsed.data.empresas_ids,
  )
  if (sync.error) return err(`Falha ao vincular empresas: ${sync.error}`)

  revalidatePath("/usuarios")
  revalidatePath(`/usuarios/${id}`)
  return ok()
}

export async function resetarSenha(id: string): Promise<Result<{ senha: string }>> {
  try {
    await requireAdmin()
  } catch (e) {
    return authErrorToResult(e)
  }

  const novaSenha = gerarSenhaForte()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: novaSenha,
  })
  if (error) return err(error.message)

  revalidatePath(`/usuarios/${id}`)
  return ok({ senha: novaSenha })
}

export async function toggleAtivo(id: string, ativo: boolean): Promise<Result<void>> {
  let adminUserId: string
  try {
    const ctx = await requireAdmin()
    adminUserId = ctx.user.id
  } catch (e) {
    return authErrorToResult(e)
  }
  if (adminUserId === id && !ativo) {
    return err("Você não pode desativar a própria conta")
  }

  const admin = createAdminClient()
  const { error } = await admin.from("usuarios").update({ ativo }).eq("id", id)
  if (error) return err(error.message)

  revalidatePath("/usuarios")
  revalidatePath(`/usuarios/${id}`)
  return ok()
}

export async function excluirUsuario(id: string): Promise<Result<void>> {
  let adminUserId: string
  try {
    const ctx = await requireAdmin()
    adminUserId = ctx.user.id
  } catch (e) {
    return authErrorToResult(e)
  }
  if (adminUserId === id) {
    return err("Você não pode excluir a própria conta")
  }

  const admin = createAdminClient()

  // ON DELETE CASCADE em usuarios cuida do registro público
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return err(error.message)

  revalidatePath("/usuarios")
  return ok()
}

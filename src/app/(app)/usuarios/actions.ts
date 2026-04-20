"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin, AuthError } from "@/lib/auth/guards"
import {
  criarUsuarioSchema, editarUsuarioSchema, gerarSenhaForte,
  type CriarUsuarioInput, type EditarUsuarioInput,
} from "@/lib/validations/usuario"

/**
 * Helper: captura AuthError e converte para o shape `{ ok: false, error }`
 * que as actions deste arquivo usam. Preserva outros erros.
 */
function authErrorToResult(e: unknown): { ok: false; error: string } {
  if (e instanceof AuthError) return { ok: false, error: e.message }
  return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido" }
}

export async function criarUsuario(payload: CriarUsuarioInput): Promise<
  { ok: true; senha: string; userId: string } | { ok: false; error: string }
> {
  try {
    await requireAdmin()
  } catch (e) {
    return authErrorToResult(e)
  }

  const parsed = criarUsuarioSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" }
  }

  const admin = createAdminClient()

  // 1. Cria em auth.users via Admin API
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.senha,
    email_confirm: true,
  })

  if (authErr || !created.user) {
    return { ok: false, error: authErr?.message ?? "Falha ao criar usuário em auth" }
  }

  // 2. Vincula em public.usuarios
  const { error: linkErr } = await admin.from("usuarios").insert({
    id: created.user.id,
    perfil_id: parsed.data.perfil_id,
    empresa_id: parsed.data.empresa_id,
    colaborador_id: parsed.data.colaborador_id ?? null,
    ativo: parsed.data.ativo,
  })

  if (linkErr) {
    // Rollback: tenta deletar o auth.user órfão
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {})
    return { ok: false, error: `Falha ao vincular usuário: ${linkErr.message}` }
  }

  revalidatePath("/usuarios")
  return { ok: true, senha: parsed.data.senha, userId: created.user.id }
}

export async function editarUsuario(
  id: string, payload: EditarUsuarioInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
  } catch (e) {
    return authErrorToResult(e)
  }

  const parsed = editarUsuarioSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" }
  }

  const admin = createAdminClient()
  const { error } = await admin.from("usuarios").update({
    perfil_id: parsed.data.perfil_id,
    empresa_id: parsed.data.empresa_id,
    colaborador_id: parsed.data.colaborador_id ?? null,
    ativo: parsed.data.ativo,
  }).eq("id", id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/usuarios")
  revalidatePath(`/usuarios/${id}`)
  return { ok: true }
}

export async function resetarSenha(id: string): Promise<
  { ok: true; senha: string } | { ok: false; error: string }
> {
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
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/usuarios/${id}`)
  return { ok: true, senha: novaSenha }
}

export async function toggleAtivo(
  id: string, ativo: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let adminUserId: string
  try {
    const ctx = await requireAdmin()
    adminUserId = ctx.user.id
  } catch (e) {
    return authErrorToResult(e)
  }
  if (adminUserId === id && !ativo) {
    return { ok: false, error: "Você não pode desativar a própria conta" }
  }

  const admin = createAdminClient()
  const { error } = await admin.from("usuarios").update({ ativo }).eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/usuarios")
  revalidatePath(`/usuarios/${id}`)
  return { ok: true }
}

export async function excluirUsuario(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let adminUserId: string
  try {
    const ctx = await requireAdmin()
    adminUserId = ctx.user.id
  } catch (e) {
    return authErrorToResult(e)
  }
  if (adminUserId === id) {
    return { ok: false, error: "Você não pode excluir a própria conta" }
  }

  const admin = createAdminClient()

  // ON DELETE CASCADE em usuarios cuida do registro público
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/usuarios")
  return { ok: true }
}

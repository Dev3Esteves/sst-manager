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
    return err(`Falha ao vincular usuário: ${linkErr.message}`)
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

/**
 * Cron diário de notificações de vencimento.
 *
 * Fluxo:
 *  1. Valida `Authorization: Bearer $CRON_SECRET` (mesmo padrão de process-jobs).
 *  2. Busca em `vw_vencimentos` os itens nos marcos de antecedência (30/15/7).
 *  3. Resolve os destinatários (admin + gestor_diretoria ativos) e seus e-mails.
 *  4. Agrupa por empresa e envia um e-mail por empresa com os itens pertinentes.
 *
 * Idempotência fraca: roda 1×/dia; cada item entra no e-mail só nos dias em que
 * `dias_restantes` bate um marco — então não há spam diário do mesmo item.
 *
 * Modo de teste: `?ate=N` (ainda exige o CRON_SECRET) ignora os marcos exatos e
 * inclui TUDO que vence em até N dias. Serve para validar o envio sem depender
 * da data exata de vencimento. N é clampado a [1, 3650].
 *
 * Observabilidade: tudo via logger estruturado (ciclo #8).
 */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger, newRequestId } from "@/lib/logger"
import { sendEmail } from "@/lib/email/send"
import {
  selecionarNotificaveis,
  filtrarParaEmpresa,
  montarAssunto,
  montarEmailHtml,
  MARCOS_NOTIFICACAO,
  type VencimentoRow,
} from "@/lib/notificacoes/vencimentos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PERFIS_NOTIFICAVEIS = ["admin", "gestor_diretoria"]

export async function GET(req: Request) {
  const requestId = newRequestId()
  const log = logger.child({ route: "cron/notificar-vencimentos", requestId })

  const secret = process.env.CRON_SECRET
  if (!secret) {
    log.error("CRON_SECRET not configured — rejeitando")
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    log.warn("cron-auth-failed")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Modo de teste: ?ate=N inclui tudo que vence em até N dias (em vez dos marcos)
  const ateRaw = new URL(req.url).searchParams.get("ate")
  const ateNum = ateRaw !== null ? Number(ateRaw) : NaN
  const modoTeste = Number.isFinite(ateNum)
  const ate = modoTeste ? Math.min(3650, Math.max(1, Math.trunc(ateNum))) : null

  // 1. Vencimentos: nos marcos (normal) ou até N dias (teste)
  let query = supabase
    .from("vw_vencimentos")
    .select("categoria, item, colaborador, empresa_id, data_vencimento, dias_restantes, urgencia")
  query = modoTeste ? query.lte("dias_restantes", ate!) : query.in("dias_restantes", [...MARCOS_NOTIFICACAO])

  const { data: vencs, error: vencErr } = await query
  if (vencErr) {
    log.exception("falha ao buscar vencimentos", vencErr)
    return NextResponse.json({ error: vencErr.message }, { status: 500 })
  }

  // No modo teste usamos tudo que a query trouxe; no normal, reaplica os marcos por segurança
  const notificaveis = modoTeste
    ? ((vencs ?? []) as VencimentoRow[])
    : selecionarNotificaveis((vencs ?? []) as VencimentoRow[])
  if (notificaveis.length === 0) {
    log.info("nenhum vencimento a notificar", { modoTeste, ate, marcos: MARCOS_NOTIFICACAO })
    return NextResponse.json({ ok: true, idle: true, itens: 0, modoTeste, ate })
  }

  // 2. Destinatários: admin + gestor_diretoria ativos, com e-mail no Auth
  const { data: usuarios, error: usrErr } = await supabase
    .from("usuarios")
    .select("id, empresa_id, perfis_acesso(nome)")
    .eq("ativo", true)
  if (usrErr) {
    log.exception("falha ao buscar usuários", usrErr)
    return NextResponse.json({ error: usrErr.message }, { status: 500 })
  }

  const { data: authList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const emailById = new Map<string, string>()
  for (const u of authList?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email)
  }

  // Agrupa e-mails de destinatários por empresa
  const emailsPorEmpresa = new Map<string, Set<string>>()
  for (const u of usuarios ?? []) {
    const perfilRaw = (u as { perfis_acesso?: { nome: string } | { nome: string }[] }).perfis_acesso
    const perfil = Array.isArray(perfilRaw) ? perfilRaw[0] : perfilRaw
    if (!perfil || !PERFIS_NOTIFICAVEIS.includes(perfil.nome)) continue
    const email = emailById.get(u.id)
    if (!email) continue
    const key = u.empresa_id ?? "__sem_empresa__"
    if (!emailsPorEmpresa.has(key)) emailsPorEmpresa.set(key, new Set())
    emailsPorEmpresa.get(key)!.add(email)
  }

  // 3. Um e-mail por empresa com os itens pertinentes
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  let enviados = 0
  let pulados = 0
  let falhas = 0

  for (const [empresaKey, emails] of Array.from(emailsPorEmpresa.entries())) {
    const empresaId = empresaKey === "__sem_empresa__" ? null : empresaKey
    const rows = filtrarParaEmpresa(notificaveis, empresaId)
    if (rows.length === 0) continue

    const result = await sendEmail({
      to: Array.from(emails),
      subject: montarAssunto(rows),
      html: montarEmailHtml(rows, { appUrl }),
    })

    if (result.ok) enviados++
    else if (result.skipped) pulados++
    else {
      falhas++
      log.warn("envio falhou", { empresaId, error: result.error })
    }
  }

  log.info("notificações processadas", {
    modoTeste,
    ate,
    itensNotificaveis: notificaveis.length,
    empresas: emailsPorEmpresa.size,
    enviados,
    pulados,
    falhas,
  })

  return NextResponse.json({ ok: true, modoTeste, ate, itens: notificaveis.length, enviados, pulados, falhas })
}

/** POST é alias do GET — facilita trigger manual em testes. */
export const POST = GET

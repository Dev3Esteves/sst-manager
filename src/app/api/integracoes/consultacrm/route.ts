// GET /api/integracoes/consultacrm?crm=123456&uf=SP
// Proxy server-side para a consultacrm (a chave nunca vai ao client).
// Restrito a quem pode cadastrar médico (admin/tec_seguranca/rh_administrativo).

import { NextResponse } from "next/server"
import { requireRole, authErrorToResponse } from "@/lib/auth/guards"
import { consultarCrm } from "@/lib/integracoes/consultacrm"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    await requireRole(["admin", "tec_seguranca", "rh_administrativo"])
  } catch (e) {
    return authErrorToResponse(e) ?? NextResponse.json({ erro: "Permissão negada" }, { status: 403 })
  }

  const url = new URL(req.url)
  const crm = url.searchParams.get("crm") ?? ""
  const uf = url.searchParams.get("uf")
  const r = await consultarCrm(crm, uf)
  if (!r.ok) {
    return NextResponse.json({ erro: r.erro, naoConfigurado: r.naoConfigurado ?? false }, { status: r.naoConfigurado ? 503 : 404 })
  }
  return NextResponse.json({ ok: true, data: r.data })
}

// GET /api/integracoes/brasilapi/cnpj?cnpj=00000000000100
// Proxy server-side para consulta de CNPJ na BrasilAPI. Perfis SST (consulta de dado público).

import { NextResponse } from "next/server"
import { requireRole, authErrorToResponse } from "@/lib/auth/guards"
import { consultarCnpj } from "@/lib/integracoes/brasilapi"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    await requireRole(["admin", "tec_seguranca", "rh_administrativo", "engenheiro_seg"])
  } catch (e) {
    return authErrorToResponse(e) ?? NextResponse.json({ erro: "Permissão negada" }, { status: 403 })
  }

  const cnpj = new URL(req.url).searchParams.get("cnpj") ?? ""
  const r = await consultarCnpj(cnpj)
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: 404 })
  return NextResponse.json({ ok: true, data: r.data })
}

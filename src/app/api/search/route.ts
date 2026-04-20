import { NextResponse } from "next/server"
import { requireAuth, authErrorToResponse } from "@/lib/auth/guards"

/**
 * Global search — usado pela paleta de comandos ⌘K.
 * Busca em 4 entidades com ILIKE, limita 5 por tipo.
 * Retorna objetos planos { id, label, sublabel, href, tipo } para a UI.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get("q") ?? "").trim()

  if (q.length < 2) {
    return NextResponse.json({ resultados: [] })
  }

  let supabase
  try {
    ;({ supabase } = await requireAuth())
  } catch (e) {
    const resp = authErrorToResponse(e)
    if (resp) return resp
    throw e
  }

  const pattern = `%${q}%`

  const [colabs, empresas, documentos, ocorrencias] = await Promise.all([
    supabase
      .from("colaboradores")
      .select("id, nome_completo, cpf, matricula, status")
      .or(`nome_completo.ilike.${pattern},cpf.ilike.${pattern},matricula.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("empresas")
      .select("id, razao_social, nome_fantasia, cnpj")
      .or(`razao_social.ilike.${pattern},nome_fantasia.ilike.${pattern},cnpj.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("documentos_sst")
      .select("id, tipo, titulo, numero_sequencial")
      .ilike("titulo", pattern)
      .limit(5),
    supabase
      .from("ocorrencias")
      .select("id, tipo, descricao, local, numero_sequencial")
      .or(`descricao.ilike.${pattern},local.ilike.${pattern}`)
      .limit(5),
  ])

  const resultados = [
    ...(colabs.data ?? []).map((c) => ({
      tipo: "colaborador" as const,
      id: c.id,
      label: c.nome_completo,
      sublabel: `CPF ${c.cpf}${c.matricula ? ` · Mat. ${c.matricula}` : ""} · ${c.status}`,
      href: `/colaboradores/${c.id}`,
    })),
    ...(empresas.data ?? []).map((e) => ({
      tipo: "empresa" as const,
      id: e.id,
      label: e.razao_social,
      sublabel: `${e.nome_fantasia ?? ""} · CNPJ ${e.cnpj}`,
      href: `/empresas/${e.id}`,
    })),
    ...(documentos.data ?? []).map((d) => ({
      tipo: "documento" as const,
      id: d.id,
      label: d.titulo ?? `${d.tipo} ${d.numero_sequencial}`,
      sublabel: `${d.tipo} · Nº ${String(d.numero_sequencial).padStart(4, "0")}`,
      href: `/documentos/${d.id}`,
    })),
    ...(ocorrencias.data ?? []).map((o) => ({
      tipo: "ocorrencia" as const,
      id: o.id,
      label: o.descricao.slice(0, 80),
      sublabel: `${o.tipo} · ${o.local} · Nº ${String(o.numero_sequencial).padStart(4, "0")}`,
      href: `/ocorrencias/${o.id}`,
    })),
  ]

  return NextResponse.json({ resultados })
}

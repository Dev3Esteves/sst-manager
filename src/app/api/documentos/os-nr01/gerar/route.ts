import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { renderOsNr01Pdf } from "@/lib/pdf/os-nr01"
import { buildOsNr01Data } from "@/lib/pdf/os-nr01-builder"
import { withRouteLogging } from "@/lib/logger"

/**
 * Emissão inicial de uma Ordem de Serviço NR-01 por função.
 *
 * 1. Monta o snapshot via `buildOsNr01Data` (resolve todas as entidades)
 * 2. Renderiza o PDF
 * 3. Persiste o registro em `documentos_sst` — `conteudo` guarda os IDs e
 *    metadados necessários para re-renderizar o PDF via `/api/documentos/[id]/pdf`
 * 4. Retorna o PDF como download
 */
export async function POST(req: Request) {
  return withRouteLogging("documentos/os-nr01/gerar", req, async (log) => {
    let body: {
      empresa_id?: string
      cargo_id?: string
      obra_id?: string
      numero?: string
      revisao?: string
      observacoes?: string | null
    }
    try {
      body = await req.json()
    } catch {
      log.warn("invalid body")
      return NextResponse.json({ error: "Body inválido" }, { status: 400 })
    }

    const { empresa_id, cargo_id, obra_id } = body
    if (!empresa_id || !cargo_id || !obra_id) {
      log.warn("missing required fields", { empresa_id: !!empresa_id, cargo_id: !!cargo_id, obra_id: !!obra_id })
      return NextResponse.json({ error: "empresa_id, cargo_id e obra_id são obrigatórios" }, { status: 400 })
    }

    const scoped = log.child({ empresaId: empresa_id, cargoId: cargo_id, obraId: obra_id })
    scoped.info("start")

    const supabase = await createClient()

    const numero = body.numero && body.numero.trim().length > 0
      ? body.numero.trim()
      : `OS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const revisao = body.revisao?.trim() || "00"
    const dataEmissao = new Date().toISOString().slice(0, 10)

    const endBuild = scoped.time("build-data")
    const built = await buildOsNr01Data(supabase, {
      empresa_id,
      cargo_id,
      obra_id,
      numero_os: numero,
      data_emissao: dataEmissao,
      revisao,
      observacoes: body.observacoes ?? null,
    })
    endBuild({ ok: built.ok })
    if (!built.ok) {
      scoped.warn("build-data failed", { status: built.status, reason: built.error })
      return NextResponse.json({ error: built.error }, { status: built.status })
    }

    const endPdf = scoped.time("render-pdf")
    const pdfElement = await renderOsNr01Pdf(built.data)
    const buffer = await renderToBuffer(pdfElement)
    endPdf({ bytes: buffer.length, colaboradores: built.colaboradoresCount })

    const { error: insertErr } = await supabase.from("documentos_sst").insert({
      tipo: "os_nr01",
      titulo: `OS NR-01 — ${built.data.cargo_titulo}`,
      empresa_id,
      obra_id,
      local_trabalho: built.data.obra_nome,
      data_emissao: dataEmissao,
      status: "emitido",
      conteudo: {
        cargo_id,
        cargo_titulo: built.data.cargo_titulo,
        obra_nome: built.data.obra_nome,
        colaboradores_count: built.colaboradoresCount,
        numero_os: numero,
        revisao,
        observacoes: body.observacoes ?? null,
      },
    })
    if (insertErr) {
      // PDF já foi gerado — não queremos quebrar o download só porque o insert
      // falhou. Mas precisamos saber que aconteceu pra investigar.
      scoped.exception("persist-failed", insertErr, { numero })
    }

    const filename = `OS-NR01-${built.data.cargo_titulo.replace(/\s+/g, "_")}-${built.data.obra_nome.replace(/\s+/g, "_")}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  })
}

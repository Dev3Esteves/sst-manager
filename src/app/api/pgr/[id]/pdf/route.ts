import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { buildPgrFo121Data } from "@/lib/pdf/pgr-fo121-builder"
import { renderPgrFo121Pdf } from "@/lib/pdf/pgr-fo121"
import { withRouteLogging } from "@/lib/logger"

/**
 * Gera (sob demanda) o PDF fidedigno ao formulário FO-121-00 (PGR/GRO).
 *
 * GET é idempotente: lê o estado atual do PGR e renderiza. Não persiste o PDF
 * — a persistência (selo + hash + Storage) entra num passo posterior.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withRouteLogging("pgr/pdf", req, async (log) => {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 })
    }
    const scoped = log.child({ pgrId: id })
    scoped.info("start")

    const supabase = await createClient()

    const endBuild = scoped.time("build-data")
    const built = await buildPgrFo121Data(supabase, id)
    endBuild({ ok: built.ok })
    if (!built.ok) {
      scoped.warn("build-data failed", { status: built.status, reason: built.error })
      return NextResponse.json({ error: built.error }, { status: built.status })
    }

    const endPdf = scoped.time("render-pdf")
    const pdfElement = await renderPgrFo121Pdf(built.data)
    const buffer = await renderToBuffer(pdfElement)
    endPdf({
      bytes: buffer.length,
      ghes: built.data.ghes.length,
      riscos: built.data.riscos.length,
      acoes: built.data.acoes.length,
      medidas: built.data.medidas.length,
    })

    const safeObra = built.data.obra_nome.replace(/[^\w\-]+/g, "_")
    const rev = String(built.data.numero_revisao).padStart(2, "0")
    const filename = `PGR_${safeObra}_Rev${rev}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  })
}

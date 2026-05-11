import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { buildInspecaoPdfData } from "@/lib/pdf/inspecao-builder"
import { renderInspecaoPdf } from "@/lib/pdf/inspecao"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const result = await buildInspecaoPdfData(supabase, id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const pdfElement = await renderInspecaoPdf(result.data, appUrl, id)
  const buffer = await renderToBuffer(pdfElement)

  const dateStr = result.data.data_inspecao.slice(0, 10).replace(/-/g, "")
  const filename = `inspecao-${dateStr}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

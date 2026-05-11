import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { buildOcorrenciaPdfData } from "@/lib/pdf/ocorrencia-builder"
import { renderOcorrenciaPdf } from "@/lib/pdf/ocorrencia"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const result = await buildOcorrenciaPdfData(supabase, id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const pdfElement = await renderOcorrenciaPdf(result.data, appUrl, id)
  const buffer = await renderToBuffer(pdfElement)

  const numero = String(result.data.numero_sequencial).padStart(4, "0")
  const filename = `ocorrencia-${numero}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

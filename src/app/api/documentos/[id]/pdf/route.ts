import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { renderAprPdf, type AprConteudo } from "@/lib/pdf/apr"
import { renderAutorizacaoNrPdf, type AutorizacaoNrConteudo } from "@/lib/pdf/autorizacao-nr"
import { renderPtPdf, type PtConteudo } from "@/lib/pdf/pt"
import { renderDdsPdf, type DdsConteudo } from "@/lib/pdf/dds"
import { renderOsNr01Pdf } from "@/lib/pdf/os-nr01"
import { buildOsNr01Data } from "@/lib/pdf/os-nr01-builder"
import { formatCNPJ } from "@/lib/validations/shared"
import { formatDate } from "@/lib/utils/vencimento"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: doc, error } = await supabase
    .from("documentos_sst")
    .select("*, empresas(razao_social, cnpj)")
    .eq("id", id)
    .single()

  if (error || !doc) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })

  const empresa = Array.isArray(doc.empresas) ? doc.empresas[0] : doc.empresas
  const numero = `${doc.tipo.toUpperCase()}-${new Date(doc.data_emissao).getFullYear()}-${String(doc.numero_sequencial).padStart(4, "0")}`

  const meta = {
    numero,
    titulo: doc.titulo ?? doc.tipo,
    empresaRazaoSocial: empresa?.razao_social ?? "—",
    empresaCnpj: empresa?.cnpj ? formatCNPJ(empresa.cnpj) : "—",
    localTrabalho: doc.local_trabalho,
    dataEmissao: formatDate(doc.data_emissao),
    dataValidade: doc.data_validade ? formatDate(doc.data_validade) : null,
    validacaoUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/documentos/${doc.id}`,
  }

  let pdfElement: React.ReactElement
  if (doc.tipo === "apr") {
    pdfElement = await renderAprPdf(meta, doc.conteudo as AprConteudo)
  } else if (doc.tipo === "autorizacao_nr10" || doc.tipo === "autorizacao_nr35" || doc.tipo === "autorizacao_nr33") {
    pdfElement = await renderAutorizacaoNrPdf(meta, doc.conteudo as AutorizacaoNrConteudo)
  } else if (doc.tipo === "pt") {
    pdfElement = await renderPtPdf(meta, doc.conteudo as PtConteudo)
  } else if (doc.tipo === "dialogo_seguranca") {
    pdfElement = await renderDdsPdf(meta, doc.conteudo as DdsConteudo)
  } else if (doc.tipo === "os_nr01") {
    // OS NR-01 por função — re-monta o PDF a partir dos IDs salvos em `conteudo`.
    // Usar IDs (em vez de snapshot completo) garante que o PDF sempre reflete
    // o estado atual do cargo/obra/colaboradores, útil quando a função é editada
    // após emissão. Se precisar imutabilidade estrita, expandir o conteudo.
    const conteudo = (doc.conteudo ?? {}) as {
      cargo_id?: string
      numero_os?: string
      revisao?: string
      observacoes?: string | null
    }
    if (!conteudo.cargo_id || !doc.obra_id) {
      return NextResponse.json(
        { error: "Documento OS NR-01 sem cargo_id/obra_id. Re-emita o documento." },
        { status: 422 },
      )
    }
    const built = await buildOsNr01Data(supabase, {
      empresa_id: doc.empresa_id,
      cargo_id: conteudo.cargo_id,
      obra_id: doc.obra_id,
      numero_os: conteudo.numero_os ?? numero,
      data_emissao: doc.data_emissao,
      revisao: conteudo.revisao ?? "00",
      observacoes: conteudo.observacoes ?? null,
    })
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status })
    }
    pdfElement = await renderOsNr01Pdf(built.data)
  } else {
    return NextResponse.json({ error: `Tipo não suportado ainda: ${doc.tipo}` }, { status: 400 })
  }

  const buffer = await renderToBuffer(pdfElement)
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}

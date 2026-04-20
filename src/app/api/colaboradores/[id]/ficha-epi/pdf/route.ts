import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { renderFichaEpiPdf, type EntregaEpiItem } from "@/lib/pdf/ficha-epi"
import { formatCNPJ } from "@/lib/validations/shared"
import { withRouteLogging } from "@/lib/logger"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withRouteLogging("colaboradores/ficha-epi/pdf", req, async (log) => {
    const { id } = await params
    const scoped = log.child({ colaboradorId: id })
    scoped.info("start")

    const supabase = await createClient()

    // Busca colaborador + empresa + cargo + obra em uma tacada
    const { data: colab, error } = await supabase
      .from("colaboradores")
      .select(`
        id, nome_completo, cpf, matricula, data_admissao,
        empresa:empresa_id(razao_social, cnpj, logo_url),
        cargo:cargo_id(titulo),
        obra:obra_id(nome)
      `)
      .eq("id", id)
      .single()

    if (error || !colab) {
      scoped.warn("colaborador não encontrado", { dbError: error?.message })
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    // Busca todas as entregas do colaborador
    const { data: entregasRaw } = await supabase
      .from("epi_entregas")
      .select(`
        data_entrega, quantidade, motivo,
        epi:epi_id(descricao, ca)
      `)
      .eq("colaborador_id", id)
      .order("data_entrega", { ascending: true })

    const entregas: EntregaEpiItem[] = (entregasRaw ?? []).map((e) => {
      const epi = Array.isArray(e.epi) ? e.epi[0] : e.epi
      return {
        data_entrega: e.data_entrega,
        quantidade: e.quantidade,
        epi_descricao: epi?.descricao ?? "—",
        ca: epi?.ca ?? null,
        motivo: e.motivo ?? null,
        data_devolucao: null,
        responsavel: null,
      }
    })

    const empresa = Array.isArray(colab.empresa) ? colab.empresa[0] : colab.empresa
    const cargo = Array.isArray(colab.cargo) ? colab.cargo[0] : colab.cargo
    const obra = Array.isArray(colab.obra) ? colab.obra[0] : colab.obra

    const endPdf = scoped.time("render-ficha-epi")
    const pdfElement = await renderFichaEpiPdf({
      empresa_razao_social: empresa?.razao_social ?? "—",
      empresa_cnpj: empresa?.cnpj ? formatCNPJ(empresa.cnpj) : "—",
      empresa_logo_url: empresa?.logo_url ?? null,
      colaborador_nome: colab.nome_completo,
      colaborador_cpf: colab.cpf,
      colaborador_matricula: colab.matricula,
      cargo_titulo: cargo?.titulo ?? null,
      data_admissao: colab.data_admissao,
      obra_nome: obra?.nome ?? null,
      entregas,
      emitido_em: new Date().toISOString(),
    })

    const buffer = await renderToBuffer(pdfElement)
    endPdf({ entregas: entregas.length, bytes: buffer.length })

    const filename = `Ficha-EPI-${colab.nome_completo.replace(/\s+/g, "_")}.pdf`

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

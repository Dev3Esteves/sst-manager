import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { gerarCatS2210Xml, gerarCatResumoTxt } from "@/lib/esocial/cat-s2210"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const formato = url.searchParams.get("formato") ?? "xml"

  const supabase = await createClient()
  const { data: oc, error } = await supabase
    .from("ocorrencias")
    .select("*, colaboradores(cpf, nome_completo, data_admissao, matricula), empresas(cnpj, razao_social)")
    .eq("id", id)
    .single()

  if (error || !oc) return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 })

  const colab = Array.isArray(oc.colaboradores) ? oc.colaboradores[0] : oc.colaboradores
  const empresa = Array.isArray(oc.empresas) ? oc.empresas[0] : oc.empresas

  if (!colab) {
    return NextResponse.json(
      { error: "Ocorrência sem colaborador vinculado — CAT exige identificação do acidentado." },
      { status: 400 },
    )
  }
  if (!empresa) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 400 })
  }
  if (!["acidente_tipico", "acidente_trajeto", "doenca_ocupacional"].includes(oc.tipo)) {
    return NextResponse.json(
      { error: "CAT só é emitida para acidentes típicos, de trajeto ou doenças ocupacionais." },
      { status: 400 },
    )
  }

  const ocorrenciaData = {
    numero_sequencial: oc.numero_sequencial,
    data_ocorrencia: oc.data_ocorrencia,
    local: oc.local,
    descricao: oc.descricao,
    natureza_lesao: oc.natureza_lesao,
    parte_corpo_atingida: oc.parte_corpo_atingida,
    agente_causador: oc.agente_causador,
    dias_afastamento: oc.dias_afastamento,
    tipo: oc.tipo,
    gravidade: oc.gravidade,
  }

  const anoOc = new Date(oc.data_ocorrencia).getFullYear()
  const fileBase = `CAT-${anoOc}-${String(oc.numero_sequencial).padStart(4, "0")}`

  if (formato === "txt") {
    const txt = gerarCatResumoTxt(ocorrenciaData, colab, empresa)
    return new NextResponse(txt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileBase}.txt"`,
      },
    })
  }

  const xml = gerarCatS2210Xml(ocorrenciaData, colab, empresa)
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileBase}.xml"`,
    },
  })
}

import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { renderCertificadoPdf, type OrientacaoCertificado } from "@/lib/pdf/certificado"
import { formatCNPJ, formatCPF } from "@/lib/validations/shared"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const orientacao: OrientacaoCertificado =
    new URL(req.url).searchParams.get("orientacao") === "retrato" ? "retrato" : "paisagem"
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("treinamentos_realizados")
    .select(`
      id, data_realizacao, data_vencimento, instrutor, entidade, local,
      colaboradores(nome_completo, cpf, empresa_id, empresas(razao_social, cnpj, logo_url, template_certificado)),
      treinamentos(titulo, nr_referencia, carga_horaria_horas, conteudo_programatico, texto_certificado, cidade_emissao)
    `)
    .eq("id", id)
    .single()

  if (error || !data) return NextResponse.json({ error: "Realização não encontrada" }, { status: 404 })

  const colab = Array.isArray(data.colaboradores) ? data.colaboradores[0] : data.colaboradores
  const trn = Array.isArray(data.treinamentos) ? data.treinamentos[0] : data.treinamentos
  const empresa = colab ? (Array.isArray(colab.empresas) ? colab.empresas[0] : colab.empresas) : null

  const anoRea = new Date(data.data_realizacao).getFullYear()
  const numero = `CERT-${anoRea}-${id.slice(0, 8).toUpperCase()}`

  const pdf = await renderCertificadoPdf({
    numero,
    aluno_nome: colab?.nome_completo ?? "",
    aluno_cpf: colab?.cpf ? formatCPF(colab.cpf) : "",
    curso_titulo: trn?.titulo ?? "",
    nr_referencia: trn?.nr_referencia ?? null,
    carga_horaria: trn?.carga_horaria_horas ?? 0,
    conteudo_programatico: trn?.conteudo_programatico ?? null,
    data_realizacao: data.data_realizacao,
    data_vencimento: data.data_vencimento,
    cidade: trn?.cidade_emissao || data.local || "São Paulo",
    instrutor_nome: data.instrutor,
    entidade: data.entidade,
    empresa_razao_social: empresa?.razao_social ?? "—",
    empresa_cnpj: empresa?.cnpj ? formatCNPJ(empresa.cnpj) : "—",
    empresa_logo_url: empresa?.logo_url ?? null,
    // Cadeia de resolução: texto específico do treinamento > template da
    // empresa (config) > padrão hardcoded (aplicado dentro do renderer).
    texto_certificado_template: trn?.texto_certificado || empresa?.template_certificado || null,
    validacao_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/treinamentos/realizacoes/${id}`,
  }, orientacao)

  const buffer = await renderToBuffer(pdf)
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}

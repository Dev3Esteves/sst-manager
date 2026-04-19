/* eslint-disable jsx-a11y/alt-text */
import { Text, View, Image } from "@react-pdf/renderer"
import { BasePdfDocument, pdfStyles, buildQrDataUrl, type DocumentoMeta } from "./base"

export type AutorizacaoNrConteudo = {
  nr: "NR-10" | "NR-35" | "NR-33"
  colaborador: {
    nome: string
    cpf: string
    cargo?: string | null
    matricula?: string | null
  }
  treinamentos_validos: { titulo: string; data_realizacao: string; data_vencimento: string; carga: number }[]
  exames_validos: { tipo: string; data_realizacao: string; data_vencimento: string; resultado: string }[]
  escopo_autorizacao: string
  assinatura_colaborador_data_url?: string
  assinatura_responsavel_data_url?: string
  responsavel_nome: string
  responsavel_cargo: string
}

const NR_TITULOS: Record<string, { titulo: string; subtitulo: string }> = {
  "NR-10": {
    titulo: "AUTORIZAÇÃO NR-10 — SEGURANÇA EM INSTALAÇÕES ELÉTRICAS",
    subtitulo: "O colaborador abaixo qualificado é autorizado a realizar intervenções em instalações elétricas conforme item 10.8 da NR-10.",
  },
  "NR-35": {
    titulo: "AUTORIZAÇÃO NR-35 — TRABALHO EM ALTURA",
    subtitulo: "O colaborador é autorizado a executar trabalho em altura conforme item 35.3 da NR-35, com base em aptidão médica e capacitação.",
  },
  "NR-33": {
    titulo: "AUTORIZAÇÃO NR-33 — ESPAÇOS CONFINADOS",
    subtitulo: "O colaborador é autorizado a atuar em espaços confinados conforme item 33.3.5 da NR-33.",
  },
}

export async function renderAutorizacaoNrPdf(meta: DocumentoMeta, conteudo: AutorizacaoNrConteudo) {
  const qr = meta.validacaoUrl ? await buildQrDataUrl(meta.validacaoUrl) : undefined
  const nrInfo = NR_TITULOS[conteudo.nr]
  const metaFinal = { ...meta, titulo: nrInfo.titulo }

  return (
    <BasePdfDocument meta={metaFinal} qrDataUrl={qr}>
      <View style={pdfStyles.section}>
        <Text style={{ fontSize: 10, marginBottom: 10 }}>{nrInfo.subtitulo}</Text>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>1. Identificação do colaborador</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Nome</Text>
            <Text style={[pdfStyles.tableCell, { flex: 3, borderRightWidth: 0 }]}>{conteudo.colaborador.nome}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>CPF</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{conteudo.colaborador.cpf}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Matrícula</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, borderRightWidth: 0 }]}>{conteudo.colaborador.matricula ?? "—"}</Text>
          </View>
          <View style={pdfStyles.tableRowLast}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Cargo</Text>
            <Text style={[pdfStyles.tableCell, { flex: 3, borderRightWidth: 0 }]}>{conteudo.colaborador.cargo ?? "—"}</Text>
          </View>
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>2. Treinamentos vigentes</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 3 }]}>Treinamento</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1, textAlign: "center" }]}>CH</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1.5, textAlign: "center" }]}>Realização</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1.5, textAlign: "center", borderRightWidth: 0 }]}>Vencimento</Text>
          </View>
          {conteudo.treinamentos_validos.map((t, i) => (
            <View key={i} style={i === conteudo.treinamentos_validos.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{t.titulo}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center" }]}>{t.carga}h</Text>
              <Text style={[pdfStyles.tableCell, { flex: 1.5, textAlign: "center" }]}>{t.data_realizacao}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 1.5, textAlign: "center", borderRightWidth: 0 }]}>{t.data_vencimento}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>3. Aptidão médica vigente (ASO)</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 2 }]}>Tipo</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1.5, textAlign: "center" }]}>Realização</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1.5, textAlign: "center" }]}>Vencimento</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1, textAlign: "center", borderRightWidth: 0 }]}>Resultado</Text>
          </View>
          {conteudo.exames_validos.map((e, i) => (
            <View key={i} style={i === conteudo.exames_validos.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{e.tipo}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 1.5, textAlign: "center" }]}>{e.data_realizacao}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 1.5, textAlign: "center" }]}>{e.data_vencimento}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center", borderRightWidth: 0 }]}>{e.resultado.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>4. Escopo da autorização</Text>
        <Text style={{ fontSize: 9 }}>{conteudo.escopo_autorizacao}</Text>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>5. Ciência e assinaturas</Text>
        <View style={pdfStyles.signatureRow}>
          <View style={pdfStyles.signatureBlock}>
            {conteudo.assinatura_colaborador_data_url && (
              <Image src={conteudo.assinatura_colaborador_data_url} style={pdfStyles.signatureImg} />
            )}
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>{conteudo.colaborador.nome}</Text>
            <Text style={{ fontSize: 8, color: "#64748b" }}>Colaborador autorizado</Text>
          </View>
          <View style={pdfStyles.signatureBlock}>
            {conteudo.assinatura_responsavel_data_url && (
              <Image src={conteudo.assinatura_responsavel_data_url} style={pdfStyles.signatureImg} />
            )}
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>{conteudo.responsavel_nome}</Text>
            <Text style={{ fontSize: 8, color: "#64748b" }}>{conteudo.responsavel_cargo}</Text>
          </View>
        </View>
      </View>
    </BasePdfDocument>
  )
}

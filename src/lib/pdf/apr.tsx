/* eslint-disable jsx-a11y/alt-text */
import { Text, View, Image } from "@react-pdf/renderer"
import { BasePdfDocument, pdfStyles, buildQrDataUrl, type DocumentoMeta } from "./base"

export type RiscoItem = {
  atividade: string
  perigo: string
  consequencia: string
  probabilidade: number // 1-5
  severidade: number    // 1-5
  medida_controle: string
  responsavel: string
}

export type AprConteudo = {
  equipe: string[]
  riscos: RiscoItem[]
  epis: string[]
  observacoes?: string
  assinaturas?: { nome: string; papel: string; assinatura_data_url?: string }[]
}

const matriz5x5Cor = (p: number, s: number): { label: string; bg: string } => {
  const score = p * s
  if (score >= 15) return { label: "Crítico", bg: "#b91c1c" }
  if (score >= 9) return { label: "Alto", bg: "#ea580c" }
  if (score >= 4) return { label: "Moderado", bg: "#eab308" }
  return { label: "Baixo", bg: "#15803d" }
}

export async function renderAprPdf(meta: DocumentoMeta, conteudo: AprConteudo) {
  const qr = meta.validacaoUrl ? await buildQrDataUrl(meta.validacaoUrl) : undefined
  return (
    <BasePdfDocument meta={meta} qrDataUrl={qr}>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>1. Equipe participante</Text>
        <Text style={{ fontSize: 9 }}>{conteudo.equipe.join(" • ") || "—"}</Text>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>2. Análise de riscos (matriz 5×5)</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 2 }]}>Atividade / Perigo</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 2 }]}>Consequência</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1, textAlign: "center" }]}>P</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1, textAlign: "center" }]}>S</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1.2, textAlign: "center" }]}>Risco</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 3 }]}>Medida de controle</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1.5, borderRightWidth: 0 }]}>Responsável</Text>
          </View>
          {conteudo.riscos.map((r, i) => {
            const color = matriz5x5Cor(r.probabilidade, r.severidade)
            return (
              <View style={pdfStyles.tableRow} key={i}>
                <View style={[pdfStyles.tableCell, { flex: 2 }]}>
                  <Text style={{ fontWeight: "bold" }}>{r.atividade}</Text>
                  <Text>{r.perigo}</Text>
                </View>
                <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{r.consequencia}</Text>
                <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center" }]}>{r.probabilidade}</Text>
                <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center" }]}>{r.severidade}</Text>
                <View style={[pdfStyles.tableCell, { flex: 1.2, padding: 0, justifyContent: "center" }]}>
                  <Text style={{ backgroundColor: color.bg, color: "#fff", padding: 3, textAlign: "center", fontWeight: "bold" }}>
                    {color.label}
                  </Text>
                </View>
                <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{r.medida_controle}</Text>
                <Text style={[pdfStyles.tableCell, { flex: 1.5, borderRightWidth: 0 }]}>{r.responsavel}</Text>
              </View>
            )
          })}
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>3. EPIs obrigatórios</Text>
        <Text style={{ fontSize: 9 }}>{conteudo.epis.join(" • ") || "—"}</Text>
      </View>

      {conteudo.observacoes && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>4. Observações</Text>
          <Text style={{ fontSize: 9 }}>{conteudo.observacoes}</Text>
        </View>
      )}

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>5. Ciência e assinaturas</Text>
        <Text style={{ fontSize: 9, marginBottom: 8 }}>
          Os participantes declaram estar cientes dos riscos listados e comprometem-se a seguir as medidas de controle.
        </Text>
        <View style={pdfStyles.signatureRow}>
          {(conteudo.assinaturas ?? []).map((a, i) => (
            <View key={i} style={pdfStyles.signatureBlock}>
              {a.assinatura_data_url && <Image src={a.assinatura_data_url} style={pdfStyles.signatureImg} />}
              <Text style={{ fontSize: 9, fontWeight: "bold" }}>{a.nome}</Text>
              <Text style={{ fontSize: 8, color: "#64748b" }}>{a.papel}</Text>
            </View>
          ))}
        </View>
      </View>
    </BasePdfDocument>
  )
}

/* eslint-disable jsx-a11y/alt-text */
import { Text, View, Image } from "@react-pdf/renderer"
import { BasePdfDocument, pdfStyles, buildQrDataUrl, type DocumentoMeta } from "./base"
import { PT_TIPO_LABEL, type PtTipo, type PtRespostaItem } from "@/lib/validations/pt"

export type PtConteudo = {
  tipo: PtTipo
  descricao_tarefa: string
  hora_inicio: string
  hora_fim: string
  solicitante: string
  executante: string
  aprovador: string
  checklist: PtRespostaItem[]
  medidas_especificas?: string | null
  assinatura_solicitante_url?: string
  assinatura_executante_url?: string
  assinatura_aprovador_url?: string
}

export async function renderPtPdf(meta: DocumentoMeta, conteudo: PtConteudo) {
  const qr = meta.validacaoUrl ? await buildQrDataUrl(meta.validacaoUrl) : undefined
  const titulo = `PERMISSÃO DE TRABALHO — ${PT_TIPO_LABEL[conteudo.tipo].toUpperCase()}`
  const metaFinal = { ...meta, titulo }

  const conformidades = conteudo.checklist.filter(c => c.conforme).length
  const total = conteudo.checklist.length
  const apto = conformidades === total

  return (
    <BasePdfDocument meta={metaFinal} qrDataUrl={qr}>
      <View style={pdfStyles.section}>
        <View style={{
          padding: 6,
          backgroundColor: apto ? "#15803d" : "#b91c1c",
          color: "#fff",
          textAlign: "center",
          marginBottom: 8,
        }}>
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>
            {apto ? `LIBERADO — ${conformidades}/${total} itens conformes` : `NÃO LIBERADO — ${conformidades}/${total} itens conformes`}
          </Text>
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>1. Descrição da tarefa</Text>
        <Text style={{ fontSize: 10 }}>{conteudo.descricao_tarefa}</Text>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>2. Período</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRowLast}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Início</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{conteudo.hora_inicio}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Fim</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2, borderRightWidth: 0 }]}>{conteudo.hora_fim}</Text>
          </View>
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>3. Checklist pré-trabalho</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 8 }]}>Item</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1, textAlign: "center" }]}>✓</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 3, borderRightWidth: 0 }]}>Observação</Text>
          </View>
          {conteudo.checklist.map((c, i) => (
            <View key={i} style={i === conteudo.checklist.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { flex: 8 }]}>{c.label}</Text>
              <Text style={[pdfStyles.tableCell, {
                flex: 1, textAlign: "center", fontWeight: "bold",
                color: c.conforme ? "#15803d" : "#b91c1c",
              }]}>{c.conforme ? "SIM" : "NÃO"}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 3, borderRightWidth: 0 }]}>{c.observacao ?? "—"}</Text>
            </View>
          ))}
        </View>
      </View>

      {conteudo.medidas_especificas && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>4. Medidas específicas de segurança</Text>
          <Text style={{ fontSize: 10 }}>{conteudo.medidas_especificas}</Text>
        </View>
      )}

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>5. Assinaturas</Text>
        <View style={pdfStyles.signatureRow}>
          <View style={pdfStyles.signatureBlock}>
            {conteudo.assinatura_solicitante_url && <Image src={conteudo.assinatura_solicitante_url} style={pdfStyles.signatureImg} />}
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>{conteudo.solicitante}</Text>
            <Text style={{ fontSize: 8, color: "#64748b" }}>Solicitante</Text>
          </View>
          <View style={pdfStyles.signatureBlock}>
            {conteudo.assinatura_executante_url && <Image src={conteudo.assinatura_executante_url} style={pdfStyles.signatureImg} />}
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>{conteudo.executante}</Text>
            <Text style={{ fontSize: 8, color: "#64748b" }}>Executante</Text>
          </View>
          <View style={pdfStyles.signatureBlock}>
            {conteudo.assinatura_aprovador_url && <Image src={conteudo.assinatura_aprovador_url} style={pdfStyles.signatureImg} />}
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>{conteudo.aprovador}</Text>
            <Text style={{ fontSize: 8, color: "#64748b" }}>Aprovador (responsável SST)</Text>
          </View>
        </View>
      </View>
    </BasePdfDocument>
  )
}

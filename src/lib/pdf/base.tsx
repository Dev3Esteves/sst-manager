/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import QRCode from "qrcode"
import type { ReactNode } from "react"
import { agoraBrasiliaDataHora } from "@/lib/utils/data-brasilia"

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    // Reserva espaço para o rodapé fixo (QR de 56pt em bottom:24 → ~84pt); evita sobreposição
    // do conteúdo com o rodapé em relatórios longos (ex.: tabelas do psicossocial).
    paddingBottom: 92,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "2 solid #1e293b",
    paddingBottom: 8,
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  empresaNome: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
  empresaCnpj: { fontSize: 9, color: "#475569", marginTop: 2 },
  titleBar: {
    backgroundColor: "#1e293b",
    padding: 6,
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 12, fontWeight: "bold", textAlign: "center" },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    fontSize: 9,
    color: "#475569",
    marginBottom: 12,
  },
  metaItem: { flexDirection: "row", gap: 4 },
  metaLabel: { fontWeight: "bold" },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e293b",
    backgroundColor: "#f1f5f9",
    padding: 4,
    marginBottom: 4,
  },
  table: { borderWidth: 0.5, borderColor: "#94a3b8" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#94a3b8" },
  tableRowLast: { flexDirection: "row" },
  tableCellHead: {
    padding: 4,
    backgroundColor: "#e2e8f0",
    fontWeight: "bold",
    fontSize: 9,
    borderRightWidth: 0.5,
    borderColor: "#94a3b8",
  },
  tableCell: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 0.5,
    borderColor: "#94a3b8",
  },
  signatureRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
  },
  signatureBlock: {
    flex: 1,
    borderTop: "1 solid #111",
    paddingTop: 4,
    alignItems: "center",
  },
  signatureImg: { height: 50, marginBottom: 4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: "0.5 solid #94a3b8",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#64748b",
  },
  qrBox: { width: 56, height: 56 },
})

export type DocumentoMeta = {
  numero: string
  titulo: string
  empresaRazaoSocial: string
  empresaCnpj: string
  localTrabalho?: string | null
  dataEmissao: string
  dataValidade?: string | null
  validacaoUrl?: string
}

export async function buildQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 120 })
}

export function PdfHeader({ meta }: { meta: DocumentoMeta }) {
  return (
    <>
      <View style={pdfStyles.header} fixed>
        <View style={pdfStyles.headerLeft}>
          <Text style={pdfStyles.empresaNome}>{meta.empresaRazaoSocial}</Text>
          <Text style={pdfStyles.empresaCnpj}>CNPJ: {meta.empresaCnpj}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 9, color: "#64748b" }}>Documento Nº</Text>
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>{meta.numero}</Text>
        </View>
      </View>
      <View style={pdfStyles.titleBar}>
        <Text style={pdfStyles.title}>{meta.titulo.toUpperCase()}</Text>
      </View>
      <View style={pdfStyles.meta}>
        {meta.localTrabalho && (
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Local:</Text>
            <Text>{meta.localTrabalho}</Text>
          </View>
        )}
        <View style={pdfStyles.metaItem}>
          <Text style={pdfStyles.metaLabel}>Emissão:</Text>
          <Text>{meta.dataEmissao}</Text>
        </View>
        {meta.dataValidade && (
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Validade:</Text>
            <Text>{meta.dataValidade}</Text>
          </View>
        )}
      </View>
    </>
  )
}

export function PdfFooter({ qrDataUrl }: { qrDataUrl?: string }) {
  const now = agoraBrasiliaDataHora()
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>Documento gerado pelo Sistema SST — {now}</Text>
      {qrDataUrl && <Image src={qrDataUrl} style={pdfStyles.qrBox} />}
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
    </View>
  )
}

export function BasePdfDocument({
  meta, qrDataUrl, children,
}: {
  meta: DocumentoMeta
  qrDataUrl?: string
  children: ReactNode
}) {
  return (
    <Document title={`${meta.numero} — ${meta.titulo}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader meta={meta} />
        {children}
        <PdfFooter qrDataUrl={qrDataUrl} />
      </Page>
    </Document>
  )
}
